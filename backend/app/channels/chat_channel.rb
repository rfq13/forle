class ChatChannel < ApplicationCable::Channel
  def subscribed
    if params[:conversation_id]
      stream_from "conversation_#{params[:conversation_id]}"
    else
      stream_from "chat_channel"
    end
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
  end
end
