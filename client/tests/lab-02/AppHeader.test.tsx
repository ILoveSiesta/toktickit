import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppHeader } from "../../src/components/AppHeader.js";
import { RequesterProvider, useRequester } from "../../src/context/RequesterContext.js";

function TestWrapperWithRequester({ children }: { children: React.ReactNode }) {
  return <RequesterProvider>{children}</RequesterProvider>;
}

describe("UI-08: AppHeader Component & Change Requester Action", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders requester name and triggers onChangeRequester callback when clicked", async () => {
    // Set simulated logged in requester in localStorage
    localStorage.setItem(
      "toktickit_selected_requester",
      JSON.stringify({
        id: 1,
        name: "Jennifer Anderson",
        email: "jennifer@toktick.it",
        isActive: true,
      })
    );

    const handleChangeRequester = vi.fn();

    render(
      <TestWrapperWithRequester>
        <AppHeader onChangeRequester={handleChangeRequester} />
      </TestWrapperWithRequester>
    );

    // Verify requester name display
    const nameDisplay = screen.getByTestId("requester-name-display");
    expect(nameDisplay).toHaveTextContent("Jennifer Anderson");

    // Click Change Requester
    const changeBtn = screen.getByTestId("change-requester-btn");
    await userEvent.click(changeBtn);

    expect(handleChangeRequester).toHaveBeenCalledTimes(1);
  });
});
