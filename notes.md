# Make some funny dummy data inspired by The Sims Buy Mode

### Models

- User
  - id
  - name
  - email
  - password
  - image
- Item
  - id
  - name
  - description
  - original price
  - image
  - user_id
- Category
  - id
  - name
- ItemCategory
  - gift_id
  - item_id
- Swap (items can't already belong to the same user)

  - item_id_1
  - item_id_2
  - approved
  - rejected

- As a user, I can
  - Sign up with an email and password
  - Log in with my email and password
  - Create an item to list on the platform
  - View my items
  - Delete my items
  - Update my items
  - View everyone else's items
  - Suggest a swap with another user
  - View pending swaps with other users and approve or reject them
    - Includes swaps you're waiting on and swaps you need to approve
  - View my swap history
