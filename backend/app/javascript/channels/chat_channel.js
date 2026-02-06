import consumer from "channels/consumer";

consumer.subscriptions.create("ChatChannel", {
  connected() {
    console.log("Connected to ChatChannel");
  },

  disconnected() {
    console.log("Disconnected from ChatChannel");
  },

  received(data) {
    const messages = document.getElementById("messages");
    if (messages) {
      messages.insertAdjacentHTML("beforeend", data.html);
    }
  },
});
