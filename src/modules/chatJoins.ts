import { MyContext } from "../core/types.ts";
import { getSettings } from "../database/welcomeDb.ts";
import helperClass from "../helpers/baseHelpers.ts";

import { Composer } from "grammy/mod.ts";

const composer = new Composer<MyContext>();

composer.on("chat_join_request", async (ctx) => {
  if (!ctx.update.chat_join_request) return;
  const update = ctx.update.chat_join_request;
  const settings = await getSettings(update.chat.id);
  let approve_or_not, welcome;
  const def_welcome_approve =
    "Hola {name}, tu solicitud para ingresar a {chat} a sido aprobada!";
  const def_welcome_decline =
    "Hola {name}, tu solicitud para ingresar a {chat} ha sido declinada!";

  if (settings == null) {
    approve_or_not = true;
    welcome = def_welcome_approve;
  } else {
    approve_or_not = settings.status;
    if (approve_or_not == true) {
      welcome = settings.welcome ?? def_welcome_approve;
      if (welcome == "") welcome = def_welcome_approve;
    } else {
      welcome = settings.welcome ?? def_welcome_decline;
      if (welcome == "") welcome = def_welcome_decline;
    }
  }

  // increment total users seen
  helperClass.TOTAL_USERS_SEEN += 1;

  // try to approve
  try {
    if (approve_or_not) {
      await ctx.api.approveChatJoinRequest(update.chat.id, update.from.id);
    } else {
      await ctx.api.declineChatJoinRequest(update.chat.id, update.from.id);
    }
  } catch (error) {
    if (error.error_code == 400 || error.error_code == 403) return;
    console.log("Error while approving user: ", error.message);
    return;
  }

  welcome += "\n\nEntra a @GruposMas18 para más grupos y a este link para contenido exclusivo https://exe.io/gT5vSC !";
  welcome = welcome.replace("{name}", update.from.first_name).replace(
    "{chat}",
    update.chat.title,
  ).replace("$name", update.from.first_name).replace(
    "$chat",
    update.chat.title,
  );

  // try to send a message
  try {
    await ctx.api.sendMessage(
      update.from.id,
      welcome,
    );
  } catch (error) {
    if (error.error_code == 403) return;
    console.log("Error while sending a message: ", error.message);
    return;
  }
});

export default composer;
