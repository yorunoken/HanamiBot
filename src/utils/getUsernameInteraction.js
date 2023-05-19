async function getUsername(interaction, collection) {
  const now = Date.now();
  let user = interaction.options.getString("user");
  const regex = /^<@\d+>$/;
  if (regex.test(user)) {
    const userID = user.match(/\d+/)[0];
    try {
      const userData = await collection.findOne({ _id: userID });
      user =
        userData.BanchoUserId ??
        (() => {
          throw new Error("no userarg");
        })();
    } catch (err) {
      await interaction.reply({ ephmeral: true, content: "The discord user you have provided does not have an account linked." });
      return false;
    }
    user = user.replace(/!{ENCRYPTED}$/, "");
  }
  if (!user) {
    try {
      const userData = await collection.findOne({ _id: interaction.user.id });
      user =
        userData.BanchoUserId ??
        (() => {
          throw new Error("no userarg");
        })();
    } catch (err) {
      await interaction.reply({ ephmeral: true, content: "Either specify a username, or connect your account with /link" });
      return false;
    }
  }
  console.log(`got username in ${Date.now() - now}ms`);
  return user;
}

module.exports = { getUsername };
