# Changelog

## 1.0.0 — 2026-11-23

First public release of Kairo Invoice Lite.

- Invoices with line items, catalog items, discount, tax, notes and payment details
- Statuses: draft, sent, viewed, paid, overdue, void; duplicate, edit, void, delete, mark as paid / unpaid
- Server-rendered PDF (@react-pdf/renderer) for downloads and email attachments
- Public invoice page with "Download PDF"
- Invoice email with the PDF attached (React Email + Resend; printed to the console without a key)
- Clients and items (price catalog), dashboard with paid, outstanding and overdue totals
- Authentication with Better Auth (email/password, Google, GitHub), workspace per user
- Sample data loader; first-run setup script
- Drizzle ORM with SQLite locally and Turso in production
