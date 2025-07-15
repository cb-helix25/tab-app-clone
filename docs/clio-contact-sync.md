# Clio Contact Synchronisation

This document outlines how contacts are created or updated in Clio when running the Matter Opening workflow. The logic lives in [`server/routes/clioContacts.js`](../server/routes/clioContacts.js) and is triggered from the `processingActions` list used by the UI.

## API endpoint

```
POST /api/clio-contacts
```

The request body contains two keys:

```json
{
  "formData": { /* fields collected from the matter form */ },
  "initials": "lz"
}
```

`initials` are used to retrieve the Clio client ID, secret and refresh token from Key Vault. The route refreshes the access token and then sends one request per contact to the Clio API.

## Contact creation logic

- `formData.matter_details.client_type` determines whether a `Person` or `Company` contact is created.
- When the type is `Individual`, every item in `formData.client_information` becomes a `Person` contact.
- When the type is `Company`, the first client that includes `company_details` generates a `Company` contact. All listed clients are also sent as `Person` contacts.
- For multiple clients the intention is to create a `Company` contact using `client_as_on_file` as the name and then create `Person` contacts for each individual client.

## Data mapping

The following fields from each client map to the Clio payload:

```json
email_addresses: [{
  "name": "Home",
  "address": client.email,
  "default_email": true
}],
phone_numbers: [{
  "name": "Home",
  "number": client.phone,
  "default_number": true
}],
addresses: [{
  "name": "Home",
  "street": `${client.buildingNumber} ${client.street}`,
  "city": client.city,
  "province": client.province,
  "postal_code": client.postal_code,
  "country": client.country
}],
date_of_birth: client.date_of_birth,
first_name: client.first_name,
last_name: client.last_name,
prefix: client.prefix
```

A minimal payload looks like the example below, based on Clio's documentation:

```json
{
  "data": {
    "attributes": {
      "first_name": "John",
      "last_name": "Smith",
      "email_addresses": [
        {
          "name": "Home",
          "address": "john@example.com",
          "default_email": true
        }
      ]
    }
  }
}
```

Refer to [Clio's API reference](https://docs.developers.clio.com/api-reference/#tag/Contacts/operation/Contact#create) for the complete schema.

This repository previously lacked documentation for this contact synchronisation step. Use this file as a reference when updating or troubleshooting the `processingActions` pipeline.

## Updates

If an existing contact with the same email address is found, the route issues a `PATCH` request to Clio's API instead of creating a new record. Only the provided fields are modified in Clio. Custom fields such as **Date of ID Expiry** and **TillerID** are sent on every create or update.