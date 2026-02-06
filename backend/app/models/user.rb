class User < ApplicationRecord
  has_many :messages
  has_many :conversations_sent, class_name: "Conversation", foreign_key: "sender_id"
  has_many :conversations_received, class_name: "Conversation", foreign_key: "recipient_id"
  validates :username, presence: true, uniqueness: true
end
