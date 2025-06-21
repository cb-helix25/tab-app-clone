# Pitch Builder Editing Levels

This note summarises the editing features available in the Pitch Builder editor.
The editor inserts **template blocks** containing snippets of email content. Each
block can be customised in a number of ways and removed entirely if needed.

## Editing levels

1. **Block** – edit or replace the whole template block. Use the block label to
   open the edit modal and submit changes.
2. **Option** – within a block, individual options can be swapped. Selecting a
   new option updates only that snippet.
3. **Sentence** – inserted snippets are now split into sentences. Each sentence
   is wrapped in a `data-sentence` span which is `contenteditable`, allowing
   quick tweaks without affecting the rest of the block. A small × icon before
   each sentence lets you remove it entirely with one click if it is not
   required.

## Scrapping content

- Each block includes a delete icon to remove it from the editor.
- The × icon on every sentence allows you to discard individual lines without
  affecting the rest of the block.
- The *Clear* button removes all inserted blocks and restores the original
  placeholders.

These controls make it easy to experiment with different blocks or remove them
completely before sending the final email.