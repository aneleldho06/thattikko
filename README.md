# LabDrop Share

Build a complete, production-ready web application called **LabDrop**.

## 1. Product concept

LabDrop is a temporary, account-free, privacy-focused transfer tool designed for students using shared college/lab computers.

The main problem it solves:

A student often needs to access code, text, screenshots, images, or documents on a lab computer. Logging into Google Drive, Gmail, WhatsApp Web, etc. creates a security risk because the student may forget to log out and another student could misuse the account.

LabDrop should allow:

**Phone → Lab PC**

without requiring the user to log into any personal account on the lab computer.

The phone can use mobile internet while the lab PC uses Ethernet. They do NOT need to be on the same Wi-Fi/network.

The main use case is transferring programming code so the user can copy/paste it directly into an IDE.

---

# 2. Core user flow

## Phone

User opens LabDrop.

Landing screen:

* LabDrop logo/name

* Short tagline:

  **"Transfer to shared computers. Without signing in."**

* Button: **Create Session**

* Button: **Join Session**

When the user clicks Create Session:

Generate a temporary session containing:

* 6-digit pairing code

* random session ID

* cryptographically secure session secret

* expiration time

* session status

Display:

```text

Your Session Code

482 719

Expires in 15:00

```

The user can then enter/paste content.

Main options:

* Code

* Text

* Image

* File

For code/text, provide a large editor.

Button:

**Send to PC**

---

# 3. Lab PC flow

On the lab computer, the user opens the same LabDrop website.

Show:

```text

Connect to your phone

Enter 6-digit session code

[ _ _ _ _ _ _ ]

[ Connect ]

```

After entering the correct code, establish a temporary connection.

Show:

```text

Connected ✓

Your phone is connected to this computer.

Session expires in 14:32

```

Incoming code/text/files should appear on the PC in real time.

For code:

* syntax highlighting

* monospaced font

* language selector

* Copy button

* Select All button

The primary action should be:

**COPY CODE**

because the user will normally paste it into a programming IDE.

---

# 4. Real-time synchronization

Implement real-time communication.

When the phone sends code:

```text

Phone

   ↓

LabDrop backend

   ↓

Connected Lab PC

```

The PC should receive the content without manually refreshing the page.

Use WebSockets or a suitable realtime technology.

Prefer:

* WebSocket

* Socket.IO

* Supabase Realtime

* Firebase Realtime Database

Choose the architecture that is most reliable and simple to deploy.

---

# 5. Security model

Security is a major part of the application.

DO NOT require Google login, email login, or any personal account.

Each session must be temporary.

Use cryptographically secure random values for:

* session IDs

* session secrets

* pairing tokens

Do NOT use predictable session IDs.

The 6-digit code should only be used as a convenient pairing mechanism.

After successful pairing, establish a stronger temporary authentication/token mechanism between the phone and PC.

The session should automatically expire.

Default expiration:

**15 minutes**

Allow the user to choose:

* 5 minutes

* 15 minutes

* 30 minutes

* 1 hour

Maximum:

**1 hour**

When the session expires:

* invalidate the session

* disconnect connected devices

* delete temporary session data

* delete uploaded temporary files

* prevent the old session from reconnecting

Display:

```text

Session Expired

Your temporary data has been deleted.

[ Create New Session ]

```

---

# 6. Privacy

Design the system so that LabDrop does not become a permanent storage service.

Temporary content should have a short lifetime.

Prefer client-side encryption for sensitive content where practical.

If implementing end-to-end encryption:

* generate encryption keys in the browser

* encrypt content before sending it to the server

* only the paired devices should be able to decrypt the content

* never store encryption keys in plaintext on the server

Clearly separate:

**authentication/pairing**

from

**content encryption**.

Never log user content.

Never store uploaded files permanently.

---

# 7. File transfer

Allow users to send:

* PNG

* JPG/JPEG

* GIF

* WEBP

* PDF

* TXT

* DOC/DOCX

* ZIP

* common programming source files

Maximum file size:

**25 MB**

Display upload progress.

Example:

```text

Uploading...

██████████████░░░░░░ 72%

example.pdf

18.2 MB

```

On the PC show:

```text

Received file

example.pdf

[ Download ]

```

For images, show a preview.

For PDFs, show a preview if the browser supports it.

Do not permanently save files on the server.

Automatically delete temporary files when the session expires.

---

# 8. Code editor

Code is the most important feature.

Build a proper code editor using a suitable library such as:

* Monaco Editor

* CodeMirror

Support common languages:

* C

* C++

* Java

* Python

* JavaScript

* HTML

* CSS

* SQL

* JSON

* Bash

* Plain Text

Automatically detect language when possible.

Provide:

* syntax highlighting

* line numbers

* indentation

* copy button

* select all

* clear

* language selector

Example:

```c

#include <stdio.h>

int main()

{

    printf("Hello World");

    return 0;

}

```

PC view should make copying extremely easy.

---

# 9. Multiple transfers

Allow the phone to send multiple pieces of content during the same session.

Create a temporary transfer history:

```text

SESSION

12:05 PM   C Program.c

12:07 PM   Screenshot.png

12:09 PM   Assignment.pdf

12:11 PM   Java Program.java

```

The history should disappear when the session expires.

Allow the user to delete individual items.

---

# 10. Send direction

Initially focus on:

**Phone → PC**

But architect the application so that later we can support:

**PC → Phone**

without rebuilding the entire system.

On the PC, eventually allow:

```text

Send to Phone

```

for retrieving files or code from the lab computer.

---

# 11. Session controls

Phone interface should contain:

**Session Code**

**Connected Device**

**Time Remaining**

**Transfers**

**End Session**

Example:

```text

Connected ✓

Lab Computer

Session expires in

12:43

3 items transferred

[ Send Code ]

[ Send File ]

[ End Session ]

```

When End Session is pressed, immediately invalidate the session.

---

# 12. Important security behavior

If a student forgets to close the browser:

the session must still expire automatically.

If someone later opens the same computer:

they should NOT see previous session data.

If the session expires:

old session URLs/tokens should not work.

If someone guesses an invalid pairing code repeatedly:

implement rate limiting / temporary lockout.

Do not expose sensitive session information in URLs where possible.

Do not put raw user content into logs.

Use HTTPS in production.

Use secure cookies/tokens where applicable.

Add appropriate CORS configuration.

Validate all uploaded file types and sizes server-side.

---

# 13. Shared-computer UX

Remember that this application is specifically designed for old college lab computers.

Therefore:

* no heavy animations

* no unnecessary video backgrounds

* no large 3D effects

* minimal JavaScript overhead

* fast initial load

* responsive but desktop-first PC interface

* keyboard-friendly controls

* works in modern browsers on older hardware

The PC interface should be extremely simple.

Example:

```text

LABDROP

Connected ✓

┌──────────────────────────────────┐

│ #include <stdio.h>               │

│                                  │

│ int main()                       │

│ {                                │

│     printf("Hello World");       │

│     return 0;                    │

│ }                                │

└──────────────────────────────────┘

[ COPY CODE ]

Session expires in 11:32

```

---

# 14. Landing page

Create a polished landing page.

Hero:

**LabDrop**

**Transfer to shared computers. Without signing in.**

Description:

"Send code, text, images and files from your phone to a shared computer using a temporary private session."

Buttons:

**Create Session**

**Join Session**

Below the hero, show three simple benefits:

### No Login

Don't enter your Google, email, or social media credentials on shared computers.

### Temporary

Sessions automatically expire and temporary data is deleted.

### Fast

Send code and files directly from your phone to the computer.

---

# 15. Visual design

Design should feel modern, trustworthy and technical.

Use:

* clean white/light background

* dark text

* subtle borders

* rounded cards

* simple blue/indigo accent

* modern sans-serif typography

* good spacing

* accessible contrast

Avoid:

* excessive gradients

* excessive glassmorphism

* unnecessary animations

* clutter

* generic AI-looking landing pages

The product should feel like a serious developer utility.

Use a simple LabDrop logo/icon representing:

**phone → computer**

---

# 16. Responsive design

The application must work properly on:

### Mobile

Optimize for:

* Android phones

* iPhones

* mobile browsers

* touch controls

### Desktop

Optimize for:

* college lab PCs

* Chrome

* Edge

* Firefox

The PC interface should prioritize readability and copying code.

---

# 17. Error handling

Create friendly errors for:

### Invalid code

```text

Invalid session code.

Please check the code and try again.

```

### Expired session

```text

This session has expired.

Create a new session to continue.

```

### Connection lost

```text

Connection interrupted.

Trying to reconnect...

```

### File too large

```text

File is too large.

Maximum size is 25 MB.

```

### Session full

If only one PC is allowed:

```text

This session is already connected to a computer.

```

---

# 18. Device pairing restriction

For the first version, allow:

**1 phone + 1 PC per session**

This keeps the security model simple.

Do not allow random people to join an existing session.

The pairing code should be single-use for establishing the PC connection.

After pairing, use the temporary authentication token rather than repeatedly relying on the 6-digit code.

---

# 19. Technology

Use a modern but simple production-ready stack.

Preferred:

### Frontend

React + TypeScript

or Next.js + TypeScript.

### Styling

Tailwind CSS.

### Backend

Node.js + TypeScript.

### Realtime

WebSockets / Socket.IO.

### Database

Use PostgreSQL/Supabase or another appropriate lightweight database.

Store only temporary session metadata.

### File storage

Use temporary object storage if required, with automatic deletion/expiration.

Do not create permanent user accounts.

---

# 20. Database model

Create an appropriate schema similar to:

```text

sessions

---------

id

pairing_code_hash

session_token_hash

created_at

expires_at

status

transfers

---------

id

session_id

type

filename

size

encrypted_content / storage_reference

created_at

expires_at

```

Never store the raw pairing code if it can be avoided.

Never store passwords because there are no user accounts.

---

# 21. Session lifecycle

Implement:

```text

CREATE SESSION

      ↓

GENERATE SECURE SESSION

      ↓

DISPLAY 6-DIGIT CODE

      ↓

PC ENTERS CODE

      ↓

VERIFY CODE

      ↓

PAIR PC

      ↓

ESTABLISH REALTIME CONNECTION

      ↓

PHONE SENDS CONTENT

      ↓

PC RECEIVES CONTENT

      ↓

SESSION EXPIRES

      ↓

DELETE TEMPORARY DATA

      ↓

DISCONNECT DEVICES

```

---

# 22. Automatic cleanup

Implement a backend cleanup process.

Expired sessions must be automatically cleaned.

Delete:

* session records

* transfer metadata

* temporary file references

* temporary uploaded files

* authentication tokens

Do not rely only on the browser closing.

---

# 23. Important practical requirement

The application must work across different networks.

Example:

```text

Phone

Mobile Data

     │

     │

     ▼

 Internet

     │

     ▼

LabDrop Backend

     │

     ▼

Lab Ethernet

     │

     ▼

Lab PC

```

Do NOT design this as a localhost-only application.

Do NOT require:

* same Wi-Fi

* hotspot

* Bluetooth

* USB

* Google login

* WhatsApp login

The entire point is that the phone and PC can be on completely different networks.

---

# 24. Testing

Before considering the application complete, test:

1. Create session on phone.

2. Join from PC.

3. Send C code.

4. Confirm it appears on PC.

5. Copy code from PC.

6. Send Java/Python code.

7. Send an image.

8. Send a PDF.

9. Test invalid session code.

10. Test expired session.

11. Test connection interruption.

12. Test reconnect.

13. Test file larger than 25 MB.

14. Test two PCs attempting to join one session.

15. Test session ending manually.

16. Confirm temporary data is deleted.

17. Confirm no Google/email login is required.

18. Test phone on mobile data + PC on Ethernet.

19. Test on an older/low-performance computer.

20. Check that no sensitive content appears in server logs.

---

# 25. Security testing

Add protection against:

* brute-force pairing codes

* session hijacking

* unauthorized WebSocket connections

* malicious file uploads

* oversized uploads

* XSS

* CSRF where applicable

* injection attacks

* replay of expired session tokens

* unauthorized access to expired sessions

Use secure random generation from the platform's cryptographic APIs.

---

# 26. Developer requirements

Do not create a fake prototype.

Build the actual working application.

All buttons must perform real actions.

All frontend/backend communication must work.

Do not use fake transfer delays or mock data.

Do not hard-code the pairing code.

Do not hard-code session IDs.

Do not pretend that encryption exists if it has not actually been implemented.

If a feature cannot be implemented securely, simplify it rather than creating a fake implementation.

Create:

* complete frontend

* complete backend

* database schema

* realtime communication

* file upload/download

* session expiration

* cleanup process

* security validation

* responsive UI

* environment configuration

* README

* setup instructions

* deployment instructions

---

# 27. Deployment

Make the project easy to deploy.

Provide:

```text

.env.example

README.md

database migration/schema

development commands

production commands

```

The final application should be deployable using common services such as:

* Vercel

* Render

* Railway

* Supabase

* Cloudflare

Choose the simplest architecture that supports reliable realtime communication and temporary file handling.

---

# 28. Final acceptance test

The final application should support this exact scenario:

I am sitting in my college computer lab.

My lab computer is connected to the internet using Ethernet.

My phone is using mobile data.

I need to write a C program.

I open LabDrop on my phone.

I tap:

**Create Session**

LabDrop shows:

```text

482719

Expires in 15:00

```

I open LabDrop on the lab computer.

I enter:

```text

482719

```

The computer becomes connected.

On my phone I paste my C program and press:

**Send to PC**

Within seconds, the C program appears on the lab computer.

I press:

**Copy Code**

and paste it into the C IDE.

When I finish, I press:

**End Session**

All temporary data becomes inaccessible.

If I forget to press End Session, the session automatically expires after the configured timeout.

At no point do I have to log into Google, Gmail, Drive, WhatsApp, or any personal account on the lab computer.

---

## Final instruction

Build **LabDrop as a real working full-stack application**, not just a UI mockup.

Prioritize:

1. **Security**

2. **Reliable phone-to-PC transfer**

3. **Temporary sessions**

4. **Code transfer/copying**

5. **File transfer**

6. **Simple shared-computer UX**

7. **Cross-network functionality**

8. **Automatic deletion/expiration**

Start by creating the project architecture, then implement the backend/session system, realtime communication, frontend interfaces, file transfer, security controls, and finally polish the UI.

After implementation, run the application and verify the complete Phone → Internet → LabDrop → Ethernet → PC workflow.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://thattikko.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c000d7ea-a5d8-42b1-90aa-799fe167bdad).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
