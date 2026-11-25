# BestBuy architecture diagrams

The [BestBuy Architecture workbook](BestBuy_Architecture.drawio) contains eleven editable pages in one uncompressed diagrams.net XML file. Each page uses native editable shapes, swimlanes, text and connectors.

## Open and edit

1. Open [diagrams.net](https://app.diagrams.net/) or the draw.io desktop application.
2. Choose **File → Open From → Device** and select `BestBuy_Architecture.drawio`.
3. Use the page tabs at the bottom to switch views. Use **Fit Page** or zoom out first for the ER view.
4. Edit shapes or connectors directly and save as a `.drawio` file. Keep the workbook as the editable source. Optional publication exports can be saved in this directory using **File → Export As**.

The workbook is independent of the application runtime and uses no linked images or custom fonts. The exported diagrams directory is this folder. [Project README](../../README.md)

## 01 High-Level System Architecture

People, Electron renderer, restricted preload, main-process services and the PostgreSQL or demo data paths. Its scope is the current desktop deployment.

## 02 Application Component Architecture

Renderer routes and state, preload context, Electron main, named handlers, adapters and the India marketplace module. Browser-only demo services appear as an alternate renderer path.

## 03 Database ER Diagram

Tables and important columns from migrations 001–003 plus the migration ledger. The ER page groups accounts and geography, inventory, sales workflows, and operational tables. Parent-to-child connectors describe cardinality. Composite foreign keys appear on the related child table and connector labels. `india_catalogue` stores model and variant metadata as JSONB and has no physical foreign key to inventory. Optional offer associations allow direct bookings. A unique offer link constrains one accepted offer to at most one booking.

## 04 Authentication and Authorization Flow

Registration, credential hashing and validation, sender-bound sessions, role checks, logout and PostgreSQL password recovery.

## 05 Customer Workflow

Account entry, manual location selection, discovery, vehicle details, price comparison, waitlist offers, purchase bookings and the appointment branch.

## 06 Dealer Workflow

Registration, profile, administrative approval, catalogue-backed stock publishing, matching queues, offers, bookings and appointment slots.

## 07 Shared Vehicle Queue Workflow

Variant and city lookup, queue upsert, active-entry reuse, position allocation, dealer participation and queue outcomes.

## 08 Test-Drive Booking Workflow

IST availability, request validation, slot reservation, decision rules, rescheduling, cancellation and completion.

## 09 API and Data Flow Architecture

React service calls through named Electron IPC channels, main-process authorization, adapter queries and response handling. This page represents the implemented IPC boundary.

## 10 Deployment and Build Architecture

Client and backend builds, Windows NSIS and unpacked targets, macOS packaging, and the separate database provisioning path.

## 11 End-to-End Booking Lifecycle

Relationship between customer, dealer, listing, queue, quote, purchase booking and the independent test-drive branch.

## Updating the workbook

Review the [migrations](../../src/database/migrations), [IPC channels](../../electron/ipcHandlers.ts), [renderer routes](../../client/src/App.tsx) and [India marketplace rules](../../src/services/indiaMarketplace.ts) when changing the diagram. Keep relationship labels aligned with SQL constraints and keep additional image exports in this directory. Use the diagrams for implementation discussions alongside their source files.
