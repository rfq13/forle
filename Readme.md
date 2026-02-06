# Simple Real-Time Chat Application

A simple real-time chat web application built with **Ruby on Rails** using **ActionCable (WebSockets)**.
This project was created as part of a technical skill challenge to demonstrate the ability to learn new technologies quickly and deliver a working production-ready application.

---

## 🚀 Live Demo

👉 **Deployed App**:
[https://your-app-name.onrender.com](https://your-app-name.onrender.com)

👉 **Source Code**:
[https://github.com/your-username/rails-realtime-chat](https://github.com/your-username/rails-realtime-chat)

---

## 🧩 Features

- Single chatroom
- Send and receive messages
- Real-time updates using WebSockets (ActionCable)
- Clean and responsive UI
- No authentication (by design, per challenge requirement)

---

## 🛠️ Tech Stack

- **Backend**: Ruby on Rails
- **Frontend**: ERB + Stimulus (Hotwire)
- **Real-time**: ActionCable (WebSockets)
- **Database**: PostgreSQL (production) / SQLite (development)
- **Deployment**: Render (or Railway / Heroku)

---

## 🏗️ Architecture Overview

```
Browser
  ↓ HTTP (POST /messages)
Rails Controller
  ↓ Save message
ActiveRecord (DB)
  ↓ Broadcast
ActionCable Channel
  ↓ WebSocket
All Connected Clients
```

---

## 📂 Folder Structure (Key Files Only)

```
app/
├── channels/
│   ├── application_cable/
│   │   ├── channel.rb
│   │   └── connection.rb
│   └── chat_channel.rb
│
├── controllers/
│   └── messages_controller.rb
│
├── models/
│   └── message.rb
│
├── javascript/
│   ├── channels/
│   │   ├── chat_channel.js
│   │   └── consumer.js
│   └── controllers/
│       └── chat_controller.js
│
├── views/
│   └── messages/
│       └── index.html.erb
│
└── views/layouts/
    └── application.html.erb
```

---

## 🔄 ActionCable Flow (Code-Level Explanation)

### 1️⃣ Client Subscribes to WebSocket Channel

**File**: `app/javascript/channels/chat_channel.js`

```js
import consumer from "./consumer";

consumer.subscriptions.create("ChatChannel", {
  received(data) {
    const messages = document.getElementById("messages");
    messages.insertAdjacentHTML("beforeend", data.html);
  },
});
```

➡️ Browser opens WebSocket connection and subscribes to `ChatChannel`.

---

### 2️⃣ Channel Definition (Server Side)

**File**: `app/channels/chat_channel.rb`

```ruby
class ChatChannel < ApplicationCable::Channel
  def subscribed
    stream_from "chat_channel"
  end
end
```

➡️ Server streams all messages broadcasted to `"chat_channel"`.

---

### 3️⃣ User Sends Message (HTTP)

**File**: `app/controllers/messages_controller.rb`

```ruby
class MessagesController < ApplicationController
  def index
    @messages = Message.order(:created_at)
    @message = Message.new
  end

  def create
    @message = Message.new(message_params)

    if @message.save
      ActionCable.server.broadcast(
        "chat_channel",
        html: render_to_string(
          partial: "message",
          locals: { message: @message }
        )
      )
    end
  end

  private

  def message_params
    params.require(:message).permit(:content)
  end
end
```

➡️ Message disimpan ke DB, lalu **broadcast ke semua client**.

---

### 4️⃣ Message Rendered as Partial

**File**: `app/views/messages/_message.html.erb`

```erb
<div class="message">
  <strong>Guest:</strong>
  <%= message.content %>
  <small><%= message.created_at.strftime("%H:%M") %></small>
</div>
```

➡️ HTML dikirim via WebSocket, langsung di-append ke DOM client.

---

### 5️⃣ Chatroom View

**File**: `app/views/messages/index.html.erb`

```erb
<h1>Chatroom</h1>

<div id="messages">
  <%= render @messages %>
</div>

<%= form_with model: @message, remote: true do |f| %>
  <%= f.text_field :content, placeholder: "Type a message..." %>
  <%= f.submit "Send" %>
<% end %>
```

➡️ Tidak perlu reload, real-time handled by ActionCable.

---

## 🧪 Testing (Optional)

Example model test:

```ruby
RSpec.describe Message, type: :model do
  it "is valid with content" do
    message = Message.new(content: "Hello")
    expect(message).to be_valid
  end
end
```

---

## 🏃‍♂️ Run Locally

```bash
git clone https://github.com/your-username/rails-realtime-chat
cd rails-realtime-chat

bundle install
rails db:create db:migrate
rails s
```

Open: [http://localhost:3000](http://localhost:3000)

---

## 📝 Notes

- Authentication is intentionally omitted as per challenge requirements.
- The application uses native Rails features (ActionCable & Hotwire) instead of third-party services.
- Focus was placed on clarity, maintainability, and real-time communication.

---

## 📌 Future Improvements

- Multiple chatrooms
- User identity
- Message pagination
- Presence indicator (online users)
