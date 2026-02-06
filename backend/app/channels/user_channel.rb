class UserChannel < ApplicationCable::Channel
  def subscribed
    if params[:user_id]
      stream_from "user_#{params[:user_id]}"
    end
  end

  def unsubscribed
  end
end
