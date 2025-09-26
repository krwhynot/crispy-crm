# Data Providers

By default, the Atomic CRM uses [Supabase](https://supabase.com) for the backend API. Supabase is an open-source alternative to Firebase, built on top of Postgres. It provides a REST API and a real-time subscription system. The generous free tier allows you to run a small CRM for free.

## Using Test Data

Developing features with an empty database can be challenging. To help with this, Atomic CRM includes a CSV file with test data that can be imported into the application.

To import the test data, follow these steps:

1. Go to the contacts page.
2. Click the "Import" button.
3. Select the file located at `test-data/contacts.csv`.

## Filters Syntax

The list filters used in this project follow the [`ra-data-postgrest`](https://github.com/raphiniert-com/ra-data-postgrest) convention, where the filter operator is concatenated to the field name with an `@`. For example, to filter contacts by first name, you would use the `first_name@eq` filter.
