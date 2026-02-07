class MessagesController < ApplicationController
  skip_before_action :verify_authenticity_token
  def index
    if params[:conversation_id]
      @messages = Message.where(conversation_id: params[:conversation_id]).order(:created_at).includes(:user)
    else
      @messages = Message.where(conversation_id: nil).order(:created_at).includes(:user)
    end
    render json: @messages.as_json(include: :user)
  end

  def create
    @message = Message.new(message_params)
    @message.conversation_id = params[:conversation_id]

    if @message.save
      channel_name = @message.conversation_id ? "conversation_#{@message.conversation_id}" : "chat_channel"
      ActionCable.server.broadcast(channel_name, @message.as_json(include: :user))
      if @message.conversation_id
        conversation = Conversation.find_by(id: @message.conversation_id)
        if conversation
          payload = {
            type: "conversation_updated",
            conversation_id: conversation.id,
            sender_id: @message.user_id
          }
          ActionCable.server.broadcast("user_#{conversation.sender_id}", payload)
          ActionCable.server.broadcast("user_#{conversation.recipient_id}", payload)
        end
      end
      render json: @message, status: :created
    else
      render json: @message.errors, status: :unprocessable_entity
    end
  end

  private

  def message_params
    params.require(:message).permit(:content, :user_id)
  end
end
