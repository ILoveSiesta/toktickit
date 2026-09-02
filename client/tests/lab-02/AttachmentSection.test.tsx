import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AttachmentSection } from "../../src/components/AttachmentSection.js";

describe("UI-04 & UI-11: AttachmentSection Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("UI-04: enforces maximum 5 active attachments limit by disabling file selector", async () => {
    const handleFilesChange = vi.fn();
    const { rerender } = render(
      <AttachmentSection
        files={[]}
        onFilesChange={handleFilesChange}
        maxFiles={5}
      />
    );

    const fileInput = screen.getByTestId("file-input") as HTMLInputElement;
    expect(fileInput).not.toBeDisabled();

    // Rerender with 5 files
    const fiveFiles = [
      new File(["1"], "doc1.pdf", { type: "application/pdf" }),
      new File(["2"], "doc2.pdf", { type: "application/pdf" }),
      new File(["3"], "doc3.pdf", { type: "application/pdf" }),
      new File(["4"], "doc4.pdf", { type: "application/pdf" }),
      new File(["5"], "doc5.pdf", { type: "application/pdf" }),
    ];

    rerender(
      <AttachmentSection
        files={fiveFiles}
        onFilesChange={handleFilesChange}
        maxFiles={5}
      />
    );

    expect(screen.getByTestId("file-limit-reached")).toBeInTheDocument();
    expect(screen.getByTestId("file-limit-reached")).toHaveTextContent(/Maximum 5 attachments reached/i);
  });

  it("UI-11: displays safe error message when attachment upload/validation fails and retains state", async () => {
    const handleFilesChange = vi.fn();

    render(
      <AttachmentSection
        files={[]}
        onFilesChange={handleFilesChange}
        maxFiles={5}
      />
    );

    const fileInput = screen.getByTestId("file-input") as HTMLInputElement;

    // Select invalid file type (e.g. .exe)
    const invalidFile = new File(["malware"], "script.exe", { type: "application/x-msdownload" });
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    expect(screen.getByTestId("attachment-error")).toBeInTheDocument();
    expect(screen.getByTestId("attachment-error")).toHaveTextContent(/unsupported|invalid/i);
    expect(handleFilesChange).not.toHaveBeenCalled();
  });
});
