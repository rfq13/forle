import { createConsumer } from "@rails/actioncable";

const cable = createConsumer("ws://172.18.162.234:3000/cable");

export default cable;
