
# Enquiries Table Field Definitions (Locked)

This is the authoritative, locked field list for the `enquiries` table. Any changes should be made with care and tracked.

Below are the fields for the `enquiries` table, with descriptions and notes for each:


1. **id** (system-level)
2. **datetime**
3. **stage**
4. **claim** – tracks date and time of claim
5. **poc** – attributes enquiries to fee earners
6. **pitch** – id referencing DealId from the Deals table
7. **aow** – routes internal hunters and campaigns
8. **tow** – connects template context
9. **moc** – forks operations and lookups
10. **rep** – confirms first poc / who took the call
11. **first**
12. **last**
13. **email** – unique identifier generally
14. **phone**
15. **value** – triggers triage
16. **notes** – confirms reason for enquiry
17. **rank** – indicates level of relationship
18. **rating** – used to feed back to the google ad console
19. **acid** – links active campaign id
20. **card_id** – links teams cards
21. **source**
22. **url** – webforms
23. **contact_referrer**
24. **company_referrer**
25. **gclid** – links google ad data

---

These notes document the current field structure and their intended use. Update this file as the schema evolves.
