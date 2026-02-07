class ConversationsController < ApplicationController
  skip_before_action :verify_authenticity_token

  def index
    user_id = params[:user_id]
    @conversations = Conversation
      .joins(:messages)
      .where(sender_id: user_id).or(Conversation.where(recipient_id: user_id))
      .distinct

    render json: @conversations.as_json(
      include: [ :sender, :recipient ],
      methods: [ :last_message ]
    )
  end

  def create
    if Conversation.between(params[:sender_id], params[:recipient_id]).present?
      @conversation = Conversation.between(params[:sender_id], params[:recipient_id]).first
    else
      @conversation = Conversation.create!(conversation_params)
    end

    render json: @conversation.as_json(include: [ :sender, :recipient ])
  end

  def show
    @conversation = Conversation.find_by(id: params[:id])
    if @conversation
      render json: @conversation.as_json(include: [ :sender, :recipient ])
    else
      render json: { error: "Conversation not found" }, status: :not_found
    end
  end

  private

  def conversation_params
    params.permit(:sender_id, :recipient_id)
  end
end
