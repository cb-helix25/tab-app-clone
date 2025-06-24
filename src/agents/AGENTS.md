# Tiller Integration Knowledge Base

This document records known response structures from external systems like Tiller and how the application should react to them. Expand this file as new schemas or result types are introduced.

## Usage
- Import shared parsing utilities from `../Instructions app/instructions` once the submodule is populated.
- Use the mappings defined here to interpret results and route them to the correct action (notification, logging, decision tree, etc.).

## Known Fields
- `checkTypeId` – Numeric identifier for the type of compliance check.
- `result` – Outcome string (e.g. `pass`, `fail`, `pending`).
- `status` – Processing status (e.g. `complete`, `error`).

## Example Mapping
| checkTypeId | result  | status    | Action                          |
|-------------|---------|-----------|---------------------------------|
| `1`         | `pass`  | `complete`| None                            |
| `1`         | `fail`  | `complete`| Notify compliance team          |
| `*`         | `*`     | `error`   | Log error and surface to 365    |

Add further mappings below as they become available.
## Additional Mapping
| checkTypeId | result | status    | Action                              |
|-------------|-------|-----------|-------------------------------------|
| `2`         | `pass`| `complete`| Log info that check 2 succeeded     |
| `2`         | `fail`| `complete`| Notify operations of failed check   |
| `2`         | `*`   | `error`   | Log error and alert on-call team    |

### checkType 3 – Risk & Compliance
| checkTypeId | result | status    | Action                                      |
|-------------|-------|-----------|---------------------------------------------|
| `3`         | `pass`| `complete`| Update local risk register                  |
| `3`         | `fail`| `complete`| Notify risk & compliance team               |
| `3`         | `*`   | `error`   | Log error and escalate via incident channel |

## Additional Mapping
| checkTypeId | result | status    | Action                              |
|-------------|-------|-----------|-------------------------------------|
| `2`         | `pass`| `complete`| Log info that check 2 succeeded     |
| `2`         | `fail`| `complete`| Notify operations of failed check   |
| `2`         | `*`   | `error`   | Log error and alert on-call team    |
