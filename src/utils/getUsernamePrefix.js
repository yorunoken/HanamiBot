async function getUsername(message, args, collection, client) {
  const now = Date.now();

  const unOsu = ["-mania", "-osu", "-fruits", "-taiko"];
  const unAllowed = ["-p", "-page", "-index", "-i"];
  args = args.filter((arg) => !unOsu.includes(arg));
  args = args.filter((arg, index) => {
    if (unAllowed.includes(arg)) {
      args.splice(index, index + 1);
      return false;
    }
    return true;
  });

  const argsJoined = args.join(" ");
  let user;
  user = await getByTag(argsJoined, collection);
  if (user) {
    console.log(`got user in ${Date.now() - now}ms`);
    return user;
  }

  user = await getByID(argsJoined, collection);
  if (user) {
    console.log(`got user in ${Date.now() - now}ms`);
    return user;
  }

  user = await getByString(argsJoined, collection, message);
  if (user) {
    console.log(`got user in ${Date.now() - now}ms`);
    return user;
  }

  message.channel.send("**Either specify a username, or link your osu!bancho account via /link**");
  return false;
}

async function getByTag(user, collection) {
  const regex = /<@(\d+)>/;
  const match = user.match(regex);
  if (match) {
    const userID = match[1];
    const userData = await collection.findOne({ _id: userID });
    user = userData.BanchoUserId ?? false;
    return user;
  }
  return undefined;
}

async function getByID(user, collection) {
  const regex = /.*(\d{17,}).*/;
  if (regex.test(user)) {
    const userID = user.match(/\d+/)[0];
    const userData = await collection.findOne({ _id: userID });
    user = userData.BanchoUserId ?? false;

    return user;
  }
  return undefined;
}

async function getByString(user, collection, message) {
  if (!user || user.length === 0) {
    const userID = message.author.id;
    const userData = await collection.findOne({ _id: userID });

    user = userData.BanchoUserId ?? false;
    return user;
  }

  user = user.replace(/["']/g, "");
  return user;
}

module.exports = { getUsername };
