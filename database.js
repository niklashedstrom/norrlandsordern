const bcrypt = require('bcrypt')

const NodeCache = require('node-cache');
const cache = new NodeCache();

require("dotenv").config()
const { MongoClient, ObjectId } = require('mongodb');
const { Long } = require('bson');

const client = new MongoClient(process.env.MONGODB_URI)

client.connect().then(() => {
  console.log('Successfully connected to database')
})

const DB_NAME = 'website'

const users = client.db(DB_NAME).collection('users')
const norrlands = client.db(DB_NAME).collection('norrlands')

exports.addUser = async (user) => {
  if (['name', 'username', 'password', 'email'].every(prop => user[prop])) {
    const hash = await bcrypt.hash(user.password, 10)
    await users.insertOne({
      username: user.username,
      name: user.name,
      hash: hash,
      email: user.email,
      wrapped_2021: true,
      joined_at: new Date(),
    })
    return true;
  }
  return false;
}

exports.userHasVistitedWrapped2021 = async (userId) => {
  await users.updateOne({ '_id': new ObjectId(userId) }, { $set: { wrapped_2021: true } })
}

exports.updateUser = async (id, newData) => {
  if (newData.password) {
    const hash = await bcrypt.hash(newData.password, 10);
    newData.hash = hash;
    delete newData.password;
  }
  return users.updateOne({ '_id': new ObjectId(id) }, { $set: newData })
}

exports.getUser = async (id, password) => {
  const user = await users.findOne({ '_id': new ObjectId(id) });
  if (password) {
    try {
      await this.authenticateUser(user.username, password);
      return user;
    } catch (e) {
      return undefined;
    }
  }
  return user;
}

exports.getAllUsers = async () => {
  return await users.find({}).toArray()
}

exports.getUserCount = async () => {
  return users.countDocuments()
}

formatToplist = (res, limit, userId) => {
  const toplist = res.slice(0,limit).map((p, i) => ({...p, index: i + 1, self: userId == p._id}))

  if (!toplist.some(p => p.self))
    res.forEach((p, i) => { if (p._id == userId) toplist.push({...p, index: i + 1, self: true})})

  return toplist;
}

exports.getToplist = async (limit, userId) => {
  let toplist = cache.get('toplist')
  if (!toplist) {
    toplist = await norrlands.aggregate([
      {
        '$group': {
          '_id': '$user_id',
          'volume_sum': {
            '$sum': '$volume'
          }
        }
      }, {
        '$sort': {
          'volume_sum': -1
        }
      }, {
        '$lookup': {
          'from': 'users',
          'localField': '_id',
          'foreignField': '_id',
          'as': 'user'
        }
      }, {
        $unwind: {
          'path': '$user'
        }
      }
    ]).toArray()
    cache.set('toplist', toplist)
  }

  return formatToplist(toplist, limit, userId)
}

exports.getWeekWinners = async (limit, from, to) => {
  // Unused, therefore not migrated.
  return []
}

exports.addToWeekTable = async (userId, place, week, year, volume) => {
  // Unused, therefore not migrated.
  return false;
}

exports.getToplistRange = async (limit, userId, range) => {
  let d = from = to = new Date()
  switch(range) {
    case 'week':
      const mon = d.getDate() - d.getDay() + (d.getDay() == 0 ? -6:1) // adjust when day is sunday
      from = new Date(d.setDate(mon)).toISOString().substr(0,10)
      to = new Date(d.setDate(d.getDate() - d.getDay()+8)).toISOString().substr(0,10)
      break;
    case 'month':
      from = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().substr(0,10)
      to = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().substr(0,10)
      break;
    case 'year':
      from = new Date(d.getFullYear(), 0, 1).toISOString().substr(0,10)
      to = new Date(d.getFullYear(), 11, 31).toISOString().substr(0,10)
      break;
    case 'wrapped2021':
      from = '2021-01-01'
      to = '2021-11-30'
      break;
  }
  const key = `toplist:${range}`
  let toplist = cache.get(key)
  if (!toplist) {
    toplist = await norrlands.aggregate([
        {
          '$match': {
            'created_at': {
              '$gte': new Date(from),
              '$lt': new Date(to),
            }
          }
        }, {
          '$group': {
            '_id': '$user_id',
            'volume_sum': {
              '$sum': '$volume'
            }
          }
        }, {
          '$sort': {
            'volume_sum': -1
          }
        }, {
          '$lookup': {
            'from': 'users',
            'localField': '_id',
            'foreignField': '_id',
            'as': 'user'
          }
        }, {
          $unwind: {
            'path': '$user'
          }
        }
      ]
    ).toArray()
    cache.set(key, toplist)
  }
  return formatToplist(toplist, limit, userId)
}

exports.getUserFromEmail = async (email) => {
  return users.find({ email: email }).toArray()
}

exports.authenticateUser = async (username, password) => {
  const user = await users.findOne({ username: username })
  if (user && await bcrypt.compare(password, user.hash))
    return user;
  else
    throw new Error('Failed to authenticate user');
}

exports.checkUsername = async (username) => {
  const user = await users.findOne({ username: username })
  return !user;
}

exports.addNorrlands = async (userId, volume) => {
  if (userId && volume) {
    cache.del('toplist', 'toplist:week', 'toplist:month', 'toplist:year')
    return (await norrlands.insertOne({
      user_id: userId,
      volume: new Long(volume),
      created_at: new Date()
    })).insertedId;
  }
}

exports.getNorrlands = async (userId) => {
  return norrlands.find({user_id: new ObjectId(userId)}).sort({ '_id': -1 }).toArray();
}

exports.updateNorrlands = async (id, data) => {
  return norrlands.updateOne({ '_id': new ObjectId(id) }, { $set: data });
}

exports.getNorrlandsById = async (id) => {
  return ( await norrlands.aggregate([
    {
      $match: { _id: id }
    }, {
      $lookup: {
        'from': 'users',
        'localField': '_id',
        'foreignField': '_id',
        'as': 'user'
      }
    }, {
      $unwind: {
        'path': '$user'
      }
    }
  ]).toArray())[0]
}

exports.getAllNorrlands = async (start, end) => {
  return norrlands.find({ created_at: { $gte: start, $lt: end }}).sort({ _id: -1 }).toArray()
}

exports.getNorrlandsPage = async (page, pageSize) => {
  return norrlands.find({}).sort({ _id: -1 }).skip(page*pageSize).limit(pageSize).toArray()
}

exports.deleteNorrlands = async (id) => {
  return norrlands.deleteOne({ _id: new ObjectId(id) })
}

exports.getLatestNorrlands = async (limit) => {
  return norrlands.aggregate([
    {
      '$sort': {
        'created_at': -1
      }
    }, {
      '$limit': limit
    }, {
      '$lookup': {
        'from': 'users',
        'localField': 'user_id',
        'foreignField': '_id',
        'as': 'user'
      }
    }, {
      '$unwind': {
        'path': '$user'
      }
    }
  ]).toArray()
}

exports.getTotalNorrlands = async () => {
  const total = (await norrlands.aggregate([
    {
      '$group': {
        '_id': '',
        'total': {
          '$sum': '$volume'
        }
      }
    }
  ]).toArray())[0].total
  return total+4686; //4686 cl var första kvällen, när allt startade.
}

exports.getAccumulatedNorrlands = async () => {
  let accumulated = cache.get('accumulated')

  if (!accumulated) {
    accumulated = await norrlands.aggregate([
      {
        '$group': {
          '_id': {
            '$dateToString': {
              'format': '%Y-%m-%d',
              'date': '$created_at'
            }
          },
          'total': {
            '$sum': '$volume'
          }
        }
      }, {
        '$sort': {
          '_id': 1
        }
      }
    ]).toArray()
    cache.set('accumulated', accumulated, 24 * 60 * 60)
  }
  const y = accumulated.map(v => v._id)
  const x = []

  let prev = 0
  accumulated.forEach(v => {
    const next = prev + v.total
    x.push(next)
    prev = next
  })

  return {
    x: x,
    y: y,
  }
}