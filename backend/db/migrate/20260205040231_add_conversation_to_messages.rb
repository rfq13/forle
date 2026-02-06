class AddConversationToMessages < ActiveRecord::Migration[8.0]
  def change
    add_reference :messages, :conversation, null: true, foreign_key: true
  end
end
