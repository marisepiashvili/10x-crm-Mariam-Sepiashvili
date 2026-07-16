# Glossary

10 technical terms used in this project, with an English example sentence and a
plain-language Georgian explanation.

**1. Authentication**
"Authentication happens on the Login page, where we check the email and password
against the stored users." — ავტორიზაცია/ავთენტიფიკაცია ნიშნავს იმის დადასტურებას,
ვინ ხარ — ჩვენს პროექტში ეს ხდება email-ისა და პაროლის შედარებით `crm_users`-ში.

**2. Session**
"Once login succeeds, the app writes a session object to `crm_session` so the user
stays logged in after a page refresh." — სესია არის ჩანაწერი იმაზე, თუ ვინ არის
ამჟამად შესული სისტემაში; ის ინახება localStorage-ში და იშლება Logout-ზე.

**3. Validation**
"Client-side validation checks that the password is at least 8 characters before the
form is ever submitted." — ვალიდაცია არის ველების შემოწმება წესების მიხედვით (მაგ.
სიგრძე, ფორმატი), სანამ მონაცემი საერთოდ შენახვამდე მივა.

**4. Fetch**
"The Clients page uses `fetch` to request the initial list of 30 users from
DummyJSON." — fetch არის ბრაუზერის ჩაშენებული ფუნქცია, რომლითაც JavaScript გზავნის
მოთხოვნას სერვერზე და იღებს პასუხს.

**5. Endpoint**
"`https://dummyjson.com/users/add` is the endpoint we POST a new client to." —
ენდფოინთი არის კონკრეტული URL სერვერზე, რომელიც კონკრეტულ მოქმედებას ან
რესურსს ემსახურება.

**6. Request method**
"DELETE is the request method used to remove a client, while POST is used to add
one." — მოთხოვნის მეთოდი განსაზღვრავს რა სახის მოქმედებას ვასრულებთ სერვერზე
(წაკითხვა GET, დამატება POST, წაშლა DELETE და ა.შ.).

**7. JSON**
"The API response arrives as JSON, so we call `response.json()` before reading
`data.users`." — JSON არის ტექსტური ფორმატი მონაცემების გადასაცემად, რომელიც
ადვილად გარდაიქმნება JavaScript-ის ობიექტებად და პირიქით.

**8. State**
"`allClients` is the in-memory state that every render function reads from." —
state არის აპლიკაციის მიმდინარე მონაცემები მეხსიერებაში (მაგ. კლიენტების მასივი),
რომელიც იცვლება მოქმედებებზე და შემდეგ ეკრანზე აისახება.

**9. Event listener**
"An event listener on the status `<select>` calls `onStatusChange` whenever the
value changes." — ივენთ ლისენერი არის ფუნქცია, რომელიც "უსმენს" კონკრეტულ
მოქმედებას (click, change, submit) და რეაგირებს მასზე.

**10. Deployment**
"After deployment to Vercel, the live URL is added to the README so graders can
open the app without cloning the repo." — დეპლოიმენტი არის პროექტის საჯარო
სერვერზე გამოქვეყნება, რის შემდეგაც საიტი ხელმისაწვდომია ინტერნეტში ბმულით.
