"use client";

import { useState } from "react";
import { Download, FileText } from "lucide-react";
import { getCustomerAccountStatement } from "@/lib/action";
import type { CustomerAccountSummary } from "@/lib/data";

type CustomerStatement = Awaited<
  ReturnType<typeof getCustomerAccountStatement>
>;

const pageMargin = 12;
const columnWidths = [25, 55, 21, 28, 25, 32];

function formatPdfDate(value: string, includeTime = false): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";

  return new Intl.DateTimeFormat("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "Asia/Dhaka",
  }).format(date);
}

function formatPdfAmount(value: number): string {
  return new Intl.NumberFormat("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function shorten(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength - 3)}...`
    : normalized;
}

async function createStatementPdf(statement: CustomerStatement): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - pageMargin * 2;
  const accountSuffix = statement.accountNumber.slice(-4);
  const isPosted = (status: string) =>
    ["complete", "approved", "success"].some((value) =>
      status.toLowerCase().includes(value),
    );
  const postedTransactions = statement.transactions.filter((transaction) =>
    isPosted(transaction.status),
  );
  const totalCredits = postedTransactions.reduce(
    (total, transaction) =>
      transaction.direction === "Credit"
        ? total + (transaction.amount ?? 0)
        : total,
    0,
  );
  const totalDebits = postedTransactions.reduce(
    (total, transaction) =>
      transaction.direction === "Debit"
        ? total + (transaction.amount ?? 0)
        : total,
    0,
  );
  let pageNumber = 1;

  pdf.setProperties({
    title: `Apex Bank statement ending ${accountSuffix}`,
    subject: "Customer account statement",
    author: "Apex Bank",
  });

  const drawPageHeader = (firstPage: boolean): number => {
    pdf.setFillColor(20, 66, 57);
    pdf.rect(0, 0, pageWidth, firstPage ? 36 : 28, "F");
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(pageMargin, 8, 18, 18, 3, 3, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.setTextColor(20, 66, 57);
    pdf.text("A", pageMargin + 9, 20, { align: "center" });
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(firstPage ? 15 : 12);
    pdf.text("APEX BANK", pageMargin + 24, firstPage ? 15 : 13);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(218, 234, 225);
    pdf.text("ACCOUNT STATEMENT", pageMargin + 24, firstPage ? 22 : 20);
    pdf.setFontSize(8);
    pdf.text(
      `Account ending ${accountSuffix}`,
      pageWidth - pageMargin,
      firstPage ? 15 : 13,
      { align: "right" },
    );
    if (!firstPage) {
      pdf.text(`Page ${pageNumber}`, pageWidth - pageMargin, 20, {
        align: "right",
      });
    }

    if (!firstPage) return 34;

    const infoY = 43;
    pdf.setFillColor(244, 248, 245);
    pdf.roundedRect(pageMargin, infoY, contentWidth, 27, 2, 2, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(104, 124, 114);
    pdf.text("ACCOUNT NUMBER", pageMargin + 5, infoY + 8);
    pdf.text("ACCOUNT TYPE", pageMargin + 76, infoY + 8);
    pdf.text("GENERATED (DHAKA)", pageMargin + 125, infoY + 8);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(31, 56, 47);
    pdf.text(statement.accountNumber, pageMargin + 5, infoY + 18);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(shorten(statement.accountType, 22), pageMargin + 76, infoY + 18);
    pdf.setFontSize(8);
    pdf.text(formatPdfDate(statement.generatedAt, true), pageMargin + 125, infoY + 18);

    const summaryY = 77;
    const cardGap = 3;
    const cardWidth = (contentWidth - cardGap * 2) / 3;
    const summaries = [
      { label: "POSTED TRANSACTIONS", value: String(postedTransactions.length) },
      { label: "TOTAL CREDITS (BDT)", value: formatPdfAmount(totalCredits) },
      { label: "TOTAL DEBITS (BDT)", value: formatPdfAmount(totalDebits) },
    ];
    summaries.forEach((summary, index) => {
      const cardX = pageMargin + index * (cardWidth + cardGap);
      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(224, 232, 227);
      pdf.roundedRect(cardX, summaryY, cardWidth, 24, 2, 2, "FD");
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6.5);
      pdf.setTextColor(104, 124, 114);
      pdf.text(summary.label, cardX + 4, summaryY + 8);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(31, 56, 47);
      pdf.text(summary.value, cardX + 4, summaryY + 18);
    });

    return 111;
  };

  const drawTableHeader = (y: number): number => {
    pdf.setFillColor(231, 239, 234);
    pdf.roundedRect(pageMargin, y, contentWidth, 10, 1.5, 1.5, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(47, 76, 63);
    const labels = [
      "Date",
      "Transaction details",
      "Direction",
      "Amount (BDT)",
      "Status",
      "Reference",
    ];
    let x = pageMargin;
    labels.forEach((label, index) => {
      pdf.text(label, x + 2, y + 6.5);
      x += columnWidths[index] ?? 0;
    });
    return y + 10;
  };

  let y = drawTableHeader(drawPageHeader(true));
  if (statement.transactions.length === 0) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(105, 120, 112);
    pdf.text("No transaction activity is recorded for this account.", pageMargin + 3, y + 10);
    y += 18;
  }

  statement.transactions.forEach((transaction, index) => {
    const details = shorten(
      [transaction.type, transaction.description]
        .filter(Boolean)
        .join(" - "),
      140,
    );
    const detailLines = pdf
      .splitTextToSize(details || "Account activity", columnWidths[1] - 4)
      .slice(0, 3) as string[];
    const dateLines = pdf
      .splitTextToSize(formatPdfDate(transaction.date), columnWidths[0] - 4)
      .slice(0, 2) as string[];
    const referenceLines = pdf
      .splitTextToSize(shorten(transaction.reference || "-", 48), columnWidths[5] - 4)
      .slice(0, 2) as string[];
    const lineCount = Math.max(
      detailLines.length,
      dateLines.length,
      referenceLines.length,
      1,
    );
    const rowHeight = Math.max(10, lineCount * 3.5 + 4);

    if (y + rowHeight > pageHeight - 18) {
      pdf.addPage();
      pageNumber += 1;
      y = drawTableHeader(drawPageHeader(false));
    }

    if (index % 2 === 0) {
      pdf.setFillColor(249, 251, 249);
      pdf.rect(pageMargin, y, contentWidth, rowHeight, "F");
    }
    pdf.setDrawColor(229, 235, 231);
    pdf.line(pageMargin, y + rowHeight, pageWidth - pageMargin, y + rowHeight);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(69, 84, 76);
    let x = pageMargin;
    pdf.text(dateLines, x + 2, y + 4.5);
    x += columnWidths[0] ?? 0;

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(39, 57, 47);
    pdf.text(detailLines, x + 2, y + 4.5);
    x += columnWidths[1] ?? 0;

    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(69, 84, 76);
    pdf.text(transaction.direction, x + 2, y + 4.5);
    x += columnWidths[2] ?? 0;

    pdf.setFont("helvetica", "normal");
    pdf.text(
      transaction.amount === null ? "-" : formatPdfAmount(transaction.amount),
      x + columnWidths[3] - 2,
      y + 4.5,
      { align: "right" },
    );
    x += columnWidths[3] ?? 0;

    const normalizedStatus = transaction.status.toLowerCase();
    if (isPosted(normalizedStatus)) {
      pdf.setTextColor(37, 116, 77);
    } else if (
      normalizedStatus.includes("reject") ||
      normalizedStatus.includes("fail")
    ) {
      pdf.setTextColor(175, 58, 58);
    } else if (normalizedStatus.includes("pending")) {
      pdf.setTextColor(163, 112, 22);
    }
    pdf.text(shorten(transaction.status, 14), x + 2, y + 4.5);
    pdf.setTextColor(69, 84, 76);
    x += columnWidths[4] ?? 0;
    pdf.setFontSize(6.5);
    pdf.text(referenceLines, x + 2, y + 4.5);

    y += rowHeight;
  });

  const totalPages = pdf.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    pdf.setPage(page);
    pdf.setDrawColor(220, 228, 223);
    pdf.line(pageMargin, pageHeight - 14, pageWidth - pageMargin, pageHeight - 14);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(113, 127, 118);
    pdf.text("Confidential - prepared for the account holder", pageMargin, pageHeight - 8);
    pdf.text(`Page ${page} of ${totalPages}`, pageWidth - pageMargin, pageHeight - 8, {
      align: "right",
    });
  }

  const dateSuffix = new Date().toISOString().slice(0, 10);
  pdf.save(
    `apex-bank-statement-xxxx${statement.accountNumber.slice(-4)}-${dateSuffix}.pdf`,
  );
}

export default function CustomerStatementDownload({
  accounts,
  isLoading,
}: {
  accounts: CustomerAccountSummary[];
  isLoading: boolean;
}) {
  const [requestedAccountNumber, setRequestedAccountNumber] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [downloadMessage, setDownloadMessage] = useState("");
  const selectableAccounts = accounts.filter(
    (
      account,
    ): account is CustomerAccountSummary & { accountNumber: string } =>
      typeof account.accountNumber === "string" &&
      /^\d{10}$/.test(account.accountNumber),
  );
  const selectedAccountNumber = selectableAccounts.some(
    (account) => account.accountNumber === requestedAccountNumber,
  )
    ? requestedAccountNumber
    : (selectableAccounts[0]?.accountNumber ?? "");

  const handleDownload = async () => {
    if (!selectedAccountNumber) return;

    setIsDownloading(true);
    setErrorMessage("");
    setDownloadMessage("");
    try {
      const statement =
        await getCustomerAccountStatement(selectedAccountNumber);
      await createStatementPdf(statement);
      setDownloadMessage(
        `Your PDF statement for account ending ${statement.accountNumber.slice(-4)} has been downloaded.`,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not download the account statement. Please try again.",
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <section
      aria-labelledby="statement-download-title"
      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-blue-50 p-3 text-blue-700">
            <FileText aria-hidden="true" size={21} />
          </span>
          <div>
            <h2
              id="statement-download-title"
              className="font-semibold text-gray-900"
            >
              Download account statement
            </h2>
            <p className="mt-1 max-w-xl text-sm leading-5 text-gray-500">
              Download a professionally formatted PDF of all transaction
              activity for an account.
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-64 sm:flex-row">
          <label className="sr-only" htmlFor="statement-account">
            Choose an account
          </label>
          <select
            id="statement-account"
            value={selectedAccountNumber}
            onChange={(event) => {
              setRequestedAccountNumber(event.target.value);
              setDownloadMessage("");
              setErrorMessage("");
            }}
            disabled={
              isLoading || isDownloading || selectableAccounts.length === 0
            }
            className="min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50"
          >
            {isLoading ? (
              <option value="">Loading accounts...</option>
            ) : selectableAccounts.length === 0 ? (
              <option value="">No accounts available</option>
            ) : (
              selectableAccounts.map((account) => (
                <option
                  key={account.accountNumber}
                  value={account.accountNumber}
                >
                  {account.accountType || "Bank"} · {account.accountNumber}
                </option>
              ))
            )}
          </select>
          <button
            type="button"
            onClick={() => void handleDownload()}
            disabled={
              isLoading || isDownloading || selectableAccounts.length === 0
            }
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download aria-hidden="true" size={17} />
            {isDownloading ? "Preparing PDF..." : "Download PDF"}
          </button>
        </div>
      </div>

      {errorMessage ? (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {errorMessage}
        </p>
      ) : null}
      {downloadMessage ? (
        <p
          role="status"
          className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          {downloadMessage}
        </p>
      ) : null}
    </section>
  );
}
