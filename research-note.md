# Research Note

**Source:** MDN Web Docs — "Using the Fetch API"
**Link:** https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
**Keywords used to find it:** `fetch api error handling response.ok mdn`

## რეზიუმე (ქართულად)

MDN-ის ეს გვერდი განმარტავს, თუ როგორ მუშაობს `fetch()` ბრაუზერში მონაცემების
სერვერიდან წამოსაღებად. მთავარი წერტილი, რომელიც ამ პროექტში პირდაპირ გამოვიყენე,
არის ის, რომ `fetch` მხოლოდ ქსელური შეცდომისას (მაგ. კავშირის გაწყვეტისას) აგდებს
`catch`-ში აჭერად შეცდომას — 404 ან 500 status კოდი **არ** ითვლება ავტომატურად
შეცდომად. ამიტომ საჭიროა ხელით შემოწმდეს `response.ok`, რაც ჩვენს `loadClients()`
ფუნქციაში ზუსტად ასეა გაკეთებული (`clients.js`/`data.js`-ში). ეს ახსნა დამეხმარა
სწორად დამეწერა error handling ლოგიკა P4.2 სექციისთვის: try/catch შემოწკვის
ქსელურ პრობლემებს, ხოლო `response.ok`-ის შემოწმება ცალკე იჭერს არასწორ HTTP
პასუხებს, რომ არასწორად "წარმატებულად" არ ჩავთვალოთ 404/500 პასუხი.
