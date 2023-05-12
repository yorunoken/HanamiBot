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

  const users = (await collection.findOne({})).users;

  const argsJoined = args.join(" ");

  let user;

  user = getByString(argsJoined, users, message);
  if (user) {
    console.log(`got user in ${Date.now() - now}ms`);
    return user;
  }

  user = getByTag(argsJoined, users);
  if (user) {
    console.log(`got user in ${Date.now() - now}ms`);
    return user;
  }

  user = getByID(argsJoined, users);
  if (user) {
    console.log(`got user in ${Date.now() - now}ms`);
    return user;
  }

  message.channel.send("**Either specify a username, or link your osu!bancho account via /link**");
  return false;
}

function getByString(user, users, message) {
  if (!user || user.length === 0) {
    const userID = message.author.id;
    try {
      user =
        users[userID].BanchoUserId ??
        (() => {
          throw new Error("no userarg");
        })();
    } catch (err) {
      return false;
    }
    return user;
  }

  user = user.replace(/["']/g, "");
  return user;
}

function getByTag(user, users) {
  const regex = /<@(\d+)>/;
  const match = user.match(regex);
  if (match) {
    const userID = match[1];
    try {
      user =
        users[userID].BanchoUserId ??
        (() => {
          throw new Error("no userarg");
        })();
    } catch (err) {
      return false;
    }
    return user;
  }
  return undefined;
}

function getByID(user, users) {
  const regex = /.*(\d{17,}).*/;
  if (regex.test(user)) {
    const userID = user.match(/\d+/)[0];
    try {
      user =
        users[userID].BanchoUserId ??
        (() => {
          throw new Error("no userarg");
        })();
    } catch (err) {
      return false;
    }
    return user;
  }
  return undefined;
}

module.exports = { getUsername };
