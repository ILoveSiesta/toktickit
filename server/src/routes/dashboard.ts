import { Router, Request, Response } from "express";
import { getPrisma } from "../prisma.js";
import { authenticate, enforcePasswordChanged } from "../middleware/auth.js";
import { Role, TicketStatus, PriorityLevel } from "@prisma/client";
import { getBangkokDateBoundaries, formatTrend } from "../utils/dashboardTime.js";

export const dashboardRouter = Router();

// Terminal statuses where a ticket is considered completed/inactive
const TERMINAL_STATUSES: TicketStatus[] = [
  TicketStatus.RESOLVED,
  TicketStatus.CLOSED,
  TicketStatus.CANCELLED,
];

// Open statuses for Requester dashboard
const REQUESTER_OPEN_STATUSES: TicketStatus[] = [
  TicketStatus.NEW,
  TicketStatus.OPEN,
  TicketStatus.IN_PROGRESS,
  TicketStatus.WAITING_FOR_REQUESTER,
];

/**
 * Handler for GET Requester Dashboard
 * Authoritative database aggregations for the logged-in requester.
 */
async function getRequesterDashboardHandler(req: Request, res: Response) {
  try {
    const currentUser = req.user!;
    if (currentUser.role !== Role.REQUESTER) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Access denied. Requester role required for requester dashboard.",
        },
      });
    }

    const prisma = getPrisma();
    const { thirtyDaysAgo } = getBangkokDateBoundaries();

    // Run parallel authoritative counts for this requester
    const [
      totalOpen,
      inProgress,
      waitingForRequester,
      recentlyResolved,
      closed,
      recentTicketsRaw,
    ] = await Promise.all([
      prisma.ticket.count({
        where: {
          requesterId: currentUser.id,
          currentStatus: { in: REQUESTER_OPEN_STATUSES },
        },
      }),
      prisma.ticket.count({
        where: {
          requesterId: currentUser.id,
          currentStatus: TicketStatus.IN_PROGRESS,
        },
      }),
      prisma.ticket.count({
        where: {
          requesterId: currentUser.id,
          currentStatus: TicketStatus.WAITING_FOR_REQUESTER,
        },
      }),
      prisma.ticket.count({
        where: {
          requesterId: currentUser.id,
          currentStatus: TicketStatus.RESOLVED,
          updatedAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.ticket.count({
        where: {
          requesterId: currentUser.id,
          currentStatus: TicketStatus.CLOSED,
        },
      }),
      prisma.ticket.findMany({
        where: { requesterId: currentUser.id },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: {
          id: true,
          ticketNumber: true,
          summary: true,
          currentStatus: true,
          requestedPriority: true,
          itPriority: true,
          updatedAt: true,
          createdAt: true,
        },
      }),
    ]);

    const recentTickets = recentTicketsRaw.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      summary: t.summary,
      status: t.currentStatus,
      priority: t.itPriority || t.requestedPriority,
      itPriority: t.itPriority,
      requestedPriority: t.requestedPriority,
      updatedAt: t.updatedAt.toISOString(),
      createdAt: t.createdAt.toISOString(),
    }));

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalOpen,
          inProgress,
          waitingForRequester,
          recentlyResolved,
          closed,
        },
        recentTickets,
      },
    });
  } catch (err: any) {
    console.error("Error retrieving requester dashboard:", err);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "Failed to retrieve requester dashboard",
      },
    });
  }
}

/**
 * Handler for GET Staff Dashboard
 * Authoritative operational metrics for IT Staff and Administrator.
 */
async function getStaffDashboardHandler(req: Request, res: Response) {
  try {
    const currentUser = req.user!;
    if (currentUser.role !== Role.IT_STAFF && currentUser.role !== Role.ADMINISTRATOR) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Access denied. IT Staff or Administrator role required for staff dashboard.",
        },
      });
    }

    const prisma = getPrisma();
    const { todayStart, yesterdayEnd } = getBangkokDateBoundaries();

    // 1. Authoritative Current Live Counts
    const [
      unassigned,
      newCount,
      openCount,
      inProgressCount,
      waitingForRequesterCount,
      myAssignedCount,
      resolvedCount,
      closedCount,
      priorityGroups,
      recentTicketsRaw,
      totalUsers,
      activeUsers,
      requestersCount,
      staffCount,
      adminCount,
    ] = await Promise.all([
      // unassigned: no owner and not terminal
      prisma.ticket.count({
        where: {
          ticketOwnerId: null,
          currentStatus: { notIn: TERMINAL_STATUSES },
        },
      }),
      prisma.ticket.count({ where: { currentStatus: TicketStatus.NEW } }),
      prisma.ticket.count({ where: { currentStatus: TicketStatus.OPEN } }),
      prisma.ticket.count({ where: { currentStatus: TicketStatus.IN_PROGRESS } }),
      prisma.ticket.count({ where: { currentStatus: TicketStatus.WAITING_FOR_REQUESTER } }),
      // myAssigned: owned by current user and not terminal
      prisma.ticket.count({
        where: {
          ticketOwnerId: currentUser.id,
          currentStatus: { notIn: TERMINAL_STATUSES },
        },
      }),
      prisma.ticket.count({ where: { currentStatus: TicketStatus.RESOLVED } }),
      prisma.ticket.count({ where: { currentStatus: TicketStatus.CLOSED } }),
      // Priority distribution
      prisma.ticket.groupBy({
        by: ["itPriority"],
        _count: { id: true },
      }),
      // Recent tickets (up to 10)
      prisma.ticket.findMany({
        orderBy: { updatedAt: "desc" },
        take: 10,
        include: {
          ticketOwner: {
            select: { id: true, name: true },
          },
        },
      }),
      // User statistics for admin
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: Role.REQUESTER } }),
      prisma.user.count({ where: { role: Role.IT_STAFF } }),
      prisma.user.count({ where: { role: Role.ADMINISTRATOR } }),
    ]);

    // 2. Trend Calculation (Yesterday vs Today)
    // Tickets unmodified since yesterday: status/assignment as of yesterday matches current status
    const [
      unmodifiedYesterdayUnassigned,
      unmodifiedYesterdayNew,
      unmodifiedYesterdayOpen,
      unmodifiedYesterdayInProgress,
      unmodifiedYesterdayWaiting,
      unmodifiedYesterdayMyAssigned,
      ticketsModifiedToday,
    ] = await Promise.all([
      prisma.ticket.count({
        where: {
          ticketOwnerId: null,
          currentStatus: { notIn: TERMINAL_STATUSES },
          createdAt: { lte: yesterdayEnd },
          updatedAt: { lte: yesterdayEnd },
        },
      }),
      prisma.ticket.count({
        where: {
          currentStatus: TicketStatus.NEW,
          createdAt: { lte: yesterdayEnd },
          updatedAt: { lte: yesterdayEnd },
        },
      }),
      prisma.ticket.count({
        where: {
          currentStatus: TicketStatus.OPEN,
          createdAt: { lte: yesterdayEnd },
          updatedAt: { lte: yesterdayEnd },
        },
      }),
      prisma.ticket.count({
        where: {
          currentStatus: TicketStatus.IN_PROGRESS,
          createdAt: { lte: yesterdayEnd },
          updatedAt: { lte: yesterdayEnd },
        },
      }),
      prisma.ticket.count({
        where: {
          currentStatus: TicketStatus.WAITING_FOR_REQUESTER,
          createdAt: { lte: yesterdayEnd },
          updatedAt: { lte: yesterdayEnd },
        },
      }),
      prisma.ticket.count({
        where: {
          ticketOwnerId: currentUser.id,
          currentStatus: { notIn: TERMINAL_STATUSES },
          createdAt: { lte: yesterdayEnd },
          updatedAt: { lte: yesterdayEnd },
        },
      }),
      // Tickets that existed yesterday but were modified today
      prisma.ticket.findMany({
        where: {
          createdAt: { lte: yesterdayEnd },
          updatedAt: { gte: todayStart },
        },
        select: {
          id: true,
          currentStatus: true,
          ticketOwnerId: true,
        },
      }),
    ]);

    // Reconstruct yesterday counts for tickets modified today
    let yesterdayModUnassigned = 0;
    let yesterdayModNew = 0;
    let yesterdayModOpen = 0;
    let yesterdayModInProgress = 0;
    let yesterdayModWaiting = 0;
    let yesterdayModMyAssigned = 0;

    for (const t of ticketsModifiedToday) {
      // If a ticket is currently OPEN, it transitioned from NEW
      if (t.currentStatus === TicketStatus.OPEN) {
        yesterdayModNew++;
      } else if (t.currentStatus === TicketStatus.IN_PROGRESS) {
        // If currently IN_PROGRESS, it transitioned from OPEN
        yesterdayModOpen++;
      } else if (t.currentStatus === TicketStatus.WAITING_FOR_REQUESTER) {
        // If currently WAITING_FOR_REQUESTER, it was IN_PROGRESS
        yesterdayModInProgress++;
      } else if (
        t.currentStatus === TicketStatus.RESOLVED ||
        t.currentStatus === TicketStatus.CLOSED
      ) {
        // If resolved/closed today, yesterday it was active IN_PROGRESS
        yesterdayModInProgress++;
      }

      // Assignment: if owner is null now, it was unassigned yesterday
      if (t.ticketOwnerId === null) {
        yesterdayModUnassigned++;
      }
      // If owned by current user and was already owned
      if (t.ticketOwnerId === currentUser.id) {
        yesterdayModMyAssigned++;
      }
    }

    const yesterdayUnassignedTotal = unmodifiedYesterdayUnassigned + yesterdayModUnassigned;
    const yesterdayNewTotal = unmodifiedYesterdayNew + yesterdayModNew;
    const yesterdayOpenTotal = unmodifiedYesterdayOpen + yesterdayModOpen;
    const yesterdayInProgressTotal = unmodifiedYesterdayInProgress + yesterdayModInProgress;
    const yesterdayWaitingTotal = unmodifiedYesterdayWaiting + yesterdayModWaiting;
    const yesterdayMyAssignedTotal = unmodifiedYesterdayMyAssigned + yesterdayModMyAssigned;

    const trends = {
      unassigned: formatTrend(unassigned - yesterdayUnassignedTotal),
      new: formatTrend(newCount - yesterdayNewTotal),
      open: formatTrend(openCount - yesterdayOpenTotal),
      inProgress: formatTrend(inProgressCount - yesterdayInProgressTotal),
      waitingForRequester: formatTrend(waitingForRequesterCount - yesterdayWaitingTotal),
      myAssigned: formatTrend(myAssignedCount - yesterdayMyAssignedTotal),
    };

    // 3. Priority Distribution
    const byPriority: Record<PriorityLevel, number> = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    };
    for (const group of priorityGroups) {
      if (group.itPriority && group.itPriority in byPriority) {
        byPriority[group.itPriority] = group._count.id;
      }
    }

    // 4. Formatted recent tickets
    const recentTickets = recentTicketsRaw.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      summary: t.summary,
      status: t.currentStatus,
      itPriority: t.itPriority || t.requestedPriority,
      priority: t.itPriority || t.requestedPriority,
      ownerId: t.ticketOwnerId,
      ownerName: t.ticketOwner ? t.ticketOwner.name : null,
      updatedAt: t.updatedAt.toISOString(),
      createdAt: t.createdAt.toISOString(),
    }));

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          unassigned,
          new: newCount,
          open: openCount,
          inProgress: inProgressCount,
          waitingForRequester: waitingForRequesterCount,
          myAssigned: myAssignedCount,
          resolved: resolvedCount,
          closed: closedCount,
        },
        trends,
        byPriority,
        recentTickets,
        adminSummary: {
          totalUsers,
          activeUsers,
          requestersCount,
          staffCount,
          adminCount,
        },
      },
    });
  } catch (err: any) {
    console.error("Error retrieving staff dashboard:", err);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "Failed to retrieve staff dashboard",
      },
    });
  }
}

// Requester Dashboard endpoints
dashboardRouter.get(
  "/dashboard/requester",
  authenticate,
  enforcePasswordChanged,
  getRequesterDashboardHandler
);
dashboardRouter.get(
  "/requester/dashboard",
  authenticate,
  enforcePasswordChanged,
  getRequesterDashboardHandler
);

// Staff / Admin Dashboard endpoints
dashboardRouter.get(
  "/dashboard/staff",
  authenticate,
  enforcePasswordChanged,
  getStaffDashboardHandler
);
dashboardRouter.get(
  "/staff/dashboard",
  authenticate,
  enforcePasswordChanged,
  getStaffDashboardHandler
);
