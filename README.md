# Points Correction Script

## Context
Users have been experiencing point duplications with their Open Loyalty accounts. For example, some users have received three points transfers in the span of up to 60 seconds for one single event type. This script aims to sort through all duplications and call Open Loyalty directly to cancel the duplications while still leaving the original, valid points transfer.

## Quickstart
1. `npm install`
2. `npm start`

This will take the .tsv test data (path defined in `index.js`) and sort through the data. Duplicates are determined based on `customer_email`, `created_at`, `state`, and `comment`. For each points transfer that is deemed to be a duplicate, the script will then pass the associated `points_transfer_id` to the points transfer cancellation endpoint, which is hit using `openLoyalty/client.js`.