class Message < ApplicationRecord
  belongs_to :user, optional: true
  belongs_to :conversation, optional: true
  validates :content, presence: true
end
