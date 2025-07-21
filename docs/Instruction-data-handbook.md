Instruction Data Handbook

A single reference for how instruction‑related data is stored, linked, fetched and seeded across the Helix Instructions stack.

1  Primary SQL tables

Table

 PK

Main foreign keys / links

Purpose

Deals

DealId

InstructionRef → Instructions

Commercial offer; records pitch → close state & payment details

DealJointClients

DealJointClientId

DealId → Deals

Minimal records (name+email) for joint clients captured during deal creation

Instructions

InstructionRef

—

Full submission incl. POID, payment & address

Documents

DocumentId

InstructionRef → Instructions

Optional uploads (engagement, ID etc.)

IDVerifications

InternalId

InstructionRef → InstructionsDealJointClientId → DealJointClients (optional)

Stores E‑ID check outcome for every lead / joint client

RiskAssessment

(composite) MatterId/InstructionRef

InstructionRef → Instructions

AML risk profile recorded after Matter opening

Matters

MatterID

InstructionRef → Instructions (optional)

Formal matter record created after checks complete

Opponents

OpponentID

OpponentID referenced by Matters

Counter‑party & solicitor details

Matter opening note – a Matter row is inserted separately (see create_matters_table.sql); once the matter exists its MatterId is copied back to Instructions and RiskAssessment so downstream queries can join on the matter rather than the submission.

2  Entity relationships

erDiagram
  Deals ||--o{ DealJointClients : contains
  Deals ||--|| Instructions : "1‑to‑0/1" (closed deals only)
  Instructions ||--o{ Documents : has
  Instructions ||--o{ IDVerifications : has
  DealJointClients ||--|| IDVerifications : "0/1‑to‑1" (when client submits)
  Instructions ||--o{ RiskAssessment : has (optional until matter)
  Instructions ||--|| Matters : opens
  Matters ||--|| Opponents : involves

Key rules

Joint clients never own a Deal; they attach to the Deal via DealJointClients and (once they submit) spawn their own Instructions row flagged with jointClient.

RiskAssessment rows are created after the Matter; therefore fetch functions must query by InstructionRef and MatterId to catch both pre‑ and post‑matter states.

3  fetchInstructionData API workflow

Auth proxy (getInstructionData) resolves the Key Vault‑stored code and calls the VNet‑secured fetchInstructionData Function.

fetchInstructionData executes batched T‑SQL:

Select Deals by PitchedBy=initials → attach DealJointClients + nested Instructions (+ docs, IDVs, risk).

Select Instructions by HelixContact=initials → attach docs, IDVs, risk + parent Deal.

Optional single‑record branches: dealId, instructionRef, prospectId.

Aggregates into JSON with these top‑level keys:

{
  "deals": [...],
  "deal": {...}|null,
  "instructions": [...],
  "instruction": {...}|null,
  "idVerifications": [...],
  "documents": [...]
}

The grouping mirrors dashboard needs: Deals for marketing view, Instructions for fee‑earner view, but each list already contains its directly related children so the UI avoids extra calls.

4  Local development datasets

JSON

Script / command

Seeds

localInstructionData.json

npm run generate:risk

Base Instructions + Risk, Docs, IDVs for every scenario

localTillerResponses.json

npm run generate:tiller

Raw Tiller samples consumed by tillerParser.ts

localIdVerifications.json

npm run generate:idverifications

Deterministic IDVerifications rows

localRiskAssessments.json

npm run generate:risk

Example RiskAssessment rows

Run REACT_APP_USE_LOCAL_DATA=true to serve the above instead of live SQL.

5  Seeding the SQL test database

Execute infra/sql/insert_production_test_data.sql (see Production Test Dataset) to truncate and reseed Deals, Instructions, Documents, IDVerifications, RiskAssessment, Matters and Opponents so the live dashboard mirrors local fixtures fileciteturn4file7.

6  Data accuracy checklist

Check

Pass criteria

Deal → Instruction link

Every closed Deal has non‑null InstructionRef & matching Instructions row

Instruction → RiskAssessment

For completed stages riskAssessments.length ≥ 1

ID verifications

For each lead & joint client: row with EIDOverallResult in (Passed,Review)

Payment

PaymentMethod='card' & PaymentResult='successful' where Amount > 0

Documents

Mandatory when AreaOfWork requires engagement pack; optional otherwise

Matter row

When all checks pass: matching Matters row linked back to Instructions

7  Updating this guide

Keep schema changes in sync.

Append new API keys or datasets to the relevant section.

Cite spec docs such as Instruction Card State Matrix to keep the UI ↔ data contract clear.

