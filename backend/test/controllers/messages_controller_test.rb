require "test_helper"

class MessagesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @conversation = conversations(:one)
  end

  test "should get index" do
    get conversation_messages_url(@conversation)
    assert_response :success
  end

  test "should create message" do
    assert_difference("Message.count") do
      post conversation_messages_url(@conversation), params: { message: { content: "Test message", user_id: users(:one).id } }
    end

    assert_response :created
  end
end
