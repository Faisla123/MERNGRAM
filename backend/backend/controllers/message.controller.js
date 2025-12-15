import { Conversation } from "../model/conversation.model.js";
import { Message } from "../model/message.model.js";

//for chatting:

export const sendMessage = async (req, res) => {
  try {
    const sendermessageid = req.id;
    const recievermessageid = req.params.id;
    const message = req.body;

    let conversation = await Conversation.findOne({
      participants: { $all: [sendermessageid, recievermessageid] },
    });

    //establish convo if not started yet:
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [sendermessageid, recievermessageid],
      });
    }

    const newMessage = await Message.create({
      sendermessageid,
      recievermessageid,
      message,
    });
    if (newMessage) {
      conversation.messages.push(newMessage._id);
    }
    await Promise.all([conversation.save(), newMessage.save()]);

    //implement socket-io for real time data transfer:

    return res.status(201).json({
      success: true,
      message: "New message",
    });
  } catch (error) {
    console.log(error);
  }
};

export const getMessage = async (req, res) => {
  try {
    const sendermessageid = req.id;
    const recievermessageid = req.params.id;

    const conversation = await Conversation.find({
      participants: { $all: [sendermessageid, recievermessageid] },
    });
    if (!conversation) {
      return res.status(200).json({
        message: [],
        success: true,
      });
    }

    return res.status(200).json({
      messages: conversation?.messages,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};
