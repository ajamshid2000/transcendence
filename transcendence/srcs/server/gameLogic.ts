/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   gameLogic2.ts                                      :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: ajamshid <ajamshid@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/11/09 14:01:28 by ajamshid          #+#    #+#             */
/*   Updated: 2025/12/17 18:34:43 by ajamshid         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import type { WebSocket as WS } from "ws";

let finalGoal = 1
const paddleHeight = 100, paddleSpeed = 6;
let gId = 0;

export interface WSMessage {
  type: "wsMessage"
  player: Player,
  newGame?: NewGame
}

interface Vec3 {
  x: number,
  y: number,
  z: number
}

interface Balld {
  radius: number;
  dx: number,
  dz: number,
  currentSpeed: number,
  beginSpeed: number,
  speedAfterHit: number
}

// const balld = { radius: 10, dx: cosDeg(45) * (Math.random() > 0.5 ? 1 : -1), dz: sinDeg(45) * (Math.random() > 0.5 ? 1 : -1), currentSpeed: 3, beginSpeed: 3, speedAfterHit: 6 };
// let counter = [0, 0];
let tableWidth: number = 800;
let tableHeight: number = 600;


interface Paddles {
  paddle1: number,
  paddle2: number,
}

interface Player {
  type: "Player",
  username: string,
  gameId?: number,
  keys: any,
  pause: number,
  isDragging1: boolean,
  isDragging2: boolean,
  dragPos1: Vec3,
  dragPos2: Vec3,
  ws?: WS
}

///the gid in player should be changed to id in serverside
let players: { [gameId: number]: Player } = {};

interface Talker {
  type: "talker",
  gameId: number,
  // finished: number,
  paddles: Paddles,
  ballpos: Vec3,
  counter: number[],
  playername: string[],
  playerCount: number,
  wallTop?: boolean,
  wallbottom?: boolean,
  wallright?: boolean,
  wallleft?: boolean
}
let talkerTemp: Talker[] = [];


interface Game {
  gameId: number,
  playerCount: number,
  mode: number,
  // finished: number,
  counter: number[],
  aiDirection: number,
  paddles: Paddles,
  balld: Balld,
  ballPos: Vec3,
  playerIds?: number[],
  playername: string[],
  wallTop?: boolean,
  wallbottom?: boolean,
  wallright?: boolean,
  wallleft?: boolean
}

interface NewGame {
  type: "newGame",
  playerCount: number,
  mode: number,
  playerIds?: number[],
  playername: string[]
}

export let keysB: { [gameId: number]: any } = {};

let games: Game[] = []

// let Direction = 0;
//AI next position finder
export function AIDirection(game: Game) {
  let difference = 0;
  let x = game.ballPos.x + (game.balld.dx * game.balld.currentSpeed * 58);
  if (!(x < tableWidth / 2 - 25 && x > -tableWidth / 2 + 25)) {
    if (x > 0)
      x = x - (tableWidth / 2 + 25);
    else x = x + (tableWidth / 2 - 25);
    difference = Math.abs(x / (game.balld.dx * game.balld.currentSpeed));
  }
  let i = game.ballPos.z + (game.balld.dz * game.balld.currentSpeed * (58 - difference)) + 40 * (Math.random() > 0.5 ? 1 : -1);;
  while ((-tableHeight / 2) > i || (tableHeight / 2) < i) {
    if ((-tableHeight / 2) > i)
      i = (((i + tableHeight / 2) * -1) - (tableHeight / 2))
    else
      i = (((i - tableHeight / 2) * -1) + (tableHeight / 2))
  }
  return i;
}


function sinDeg(degrees: number) {
  return Math.sin(degrees * Math.PI / 180);
}
function cosDeg(degrees: number) {
  return Math.cos(degrees * Math.PI / 180);
}

export function moveBall(games: Game): Vec3 {
  let playerCount = games.playerCount;
  let paddle1X = tableWidth / 2 - 20;
  let paddle2X = -(tableWidth / 2) + 20;
  let wallLeftPosx = tableWidth / 2 + 5;
  let wallRightPosx = -tableWidth / 2 - 5;

  //move ball
  games.ballPos.x += games.balld.dx * games.balld.currentSpeed;
  games.ballPos.z += games.balld.dz * games.balld.currentSpeed;

  //top/bottom bounce
  if ((games.ballPos.z + games.balld.radius >= tableHeight / 2 && games.balld.dz > 0) || (games.ballPos.z - games.balld.radius <= -tableHeight / 2 && games.balld.dz < 0)) {
    games.balld.dz *= -1;
  }

  //paddle1 bounce
  if (games.ballPos.x + games.balld.radius >= paddle1X - 5 &&
    games.ballPos.z < (games.paddles.paddle1 + (paddleHeight / 2)) && games.ballPos.z > (games.paddles.paddle1 - (paddleHeight / 2))) {
    let angle = (tableHeight / 2 + games.ballPos.z) - (tableHeight / 2 + games.paddles.paddle1);
    let direction = (angle >= 0) ? 1 : -1;
    if (games.balld.dx > 0 && games.ballPos.x + games.balld.radius > paddle1X) {
      games.balld.dz = sinDeg(Math.abs(Math.trunc(angle)) * 1.5) * direction;
      games.balld.dx = cosDeg(Math.abs(Math.trunc(angle)) * 1.5) * -1;
    }
    games.balld.currentSpeed = games.balld.speedAfterHit;
  }

  //paddle2 bounce
  if (games.ballPos.x - games.balld.radius <= paddle2X + 5 &&
    games.ballPos.z < (games.paddles.paddle2 + (paddleHeight / 2)) && games.ballPos.z > (games.paddles.paddle2 - (paddleHeight / 2))) {
    let angle = (tableHeight / 2 + games.ballPos.z) - (tableHeight / 2 + games.paddles.paddle2);
    let direction = (angle >= 0) ? 1 : -1;
    if (games.balld.dx < 0 && games.ballPos.x - games.balld.radius < paddle2X) {
      games.balld.dz = sinDeg(Math.abs(Math.trunc(angle))) * direction;
      games.balld.dx = cosDeg(Math.abs(Math.trunc(angle)));
    }
    games.balld.currentSpeed = games.balld.speedAfterHit;
  }

  //wall colusion
  if (games.ballPos.x + games.balld.radius >= wallLeftPosx || games.ballPos.x - games.balld.radius <= wallRightPosx) {
    if (games.ballPos.x + games.balld.radius >= wallLeftPosx)
      games.counter[1]++;
    else
      games.counter[0]++;
    if (games.counter[0] === finalGoal && playerCount > 0) {
      // games.finished = 1;
      console.log("game finished");
    }
    if (games.counter[1] === finalGoal && playerCount > 0) {
      // games.finished = 1;
      console.log("game finished");
    }
    // drawText();
    games.ballPos = { x: 0, y: games.balld.radius + 1, z: 0 };
    games.balld.dx = cosDeg(45) * (Math.random() > 0.5 ? 1 : -1);
    games.balld.dz = sinDeg(45) * (Math.random() > 0.5 ? 1 : -1);
    games.balld.currentSpeed = games.balld.beginSpeed;
  }
  return games.ballPos;
}

export function movePaddles(games: Game): Paddles {


  let playerCount = games.playerCount;
  let keys = undefined;

  let isDragging1: boolean = false;
  let isDragging2: boolean = false;
  let dragPos1: Vec3 = { x: 0, y: 0, z: 0 };
  let dragPos2: Vec3 = { x: 0, y: 0, z: 0 };

  let i = findPlayer(games.playername[0])
  if (i != -1) {
    keys = players[i].keys;
    isDragging2 = players[i].isDragging2
    isDragging1 = players[i].isDragging1
    dragPos1 = players[i].dragPos1
    dragPos2 = players[i].dragPos2
  }
  if (games.mode == 0) {
    let playerIndex = findPlayer(undefined, games.gameId);
    if (playerIndex == -1) {
      console.log("player not found mode = 0, index -1")
      if (keys == undefined)
        return (games.paddles);
    }
    else {
      keys = players[playerIndex].keys
      isDragging2 = players[playerIndex].isDragging2
      isDragging1 = players[playerIndex].isDragging1
      dragPos1 = players[playerIndex].dragPos1
      dragPos2 = players[playerIndex].dragPos2

    }
  }

  // if (findPlayer(games.playername[0]) == -1)
  //   console.log("player not found");
  // let talkerTempIndexForGame = players.findIndex(g => g.gameId === games.gameId)
  if (keys != undefined && keys["w"])
    console.log("w pressed");
  // if (keys == undefined)
  //   return games.paddles;

  let Direction = games.aiDirection;

  // console.log("player count ",playerCount);


  if (playerCount > 0) {
    if (isDragging1) {
      console.log("is dragging 1");
      if ((dragPos1.z < games.paddles.paddle1) && games.paddles.paddle1 > -tableHeight / 2 + 50) games.paddles.paddle1 -= paddleSpeed;
      if ((dragPos1.z > games.paddles.paddle1) && games.paddles.paddle1 < tableHeight / 2 - 50) games.paddles.paddle1 += paddleSpeed;
    }
    if (keys["w"] && games.paddles.paddle1 > -tableHeight / 2 + 50) games.paddles.paddle1 -= paddleSpeed;
    if (keys["s"] && games.paddles.paddle1 < tableHeight / 2 - 50) games.paddles.paddle1 += paddleSpeed;
  }
  else {
    if ((Direction < games.paddles.paddle1) && games.paddles.paddle1 > -tableHeight / 2 + 50 && games.balld.dx > 0) games.paddles.paddle1 -= paddleSpeed;
    if ((Direction > games.paddles.paddle1) && games.paddles.paddle1 < tableHeight / 2 - 50 && games.balld.dx > 0) games.paddles.paddle1 += paddleSpeed;
  }

  if (playerCount > 1) {
    if (isDragging2) {
      console.log("is gragging 2");
      if ((dragPos2.z < games.paddles.paddle2) && games.paddles.paddle2 > -tableHeight / 2 + 50) games.paddles.paddle2 -= paddleSpeed;
      if ((dragPos2.z > games.paddles.paddle2) && games.paddles.paddle2 < tableHeight / 2 - 50) games.paddles.paddle2 += paddleSpeed;
    }
    if (keys["ArrowUp"] && games.paddles.paddle2 > -tableHeight / 2 + 50) games.paddles.paddle2 -= paddleSpeed;
    if (keys["ArrowDown"] && games.paddles.paddle2 < tableHeight / 2 - 50) games.paddles.paddle2 += paddleSpeed;
  }
  else {
    if ((Direction < games.paddles.paddle2) && games.paddles.paddle2 > -tableHeight / 2 + 50 && games.balld.dx < 0) games.paddles.paddle2 -= paddleSpeed;
    if ((Direction > games.paddles.paddle2) && games.paddles.paddle2 < tableHeight / 2 - 50 && games.balld.dx < 0) games.paddles.paddle2 += paddleSpeed;
  }
  return games.paddles;
}

function findPlayer(username?: string, gId?: number): number {
  for (const gameId of Object.keys(players)) {
    const player = players[Number(gameId)];
    if (username != undefined && player.username == username)
      return Number(gameId);
    if (gId != undefined && player.gameId == gId)
      return Number(gameId);
  }
  return -1;
}
export function removePlayerByWS(ws: WS) {
  console.log("removebyws called on ")
  const player: Player | undefined = Object.values(players).find(player => player.ws === ws);
  console.log("removebyws called on ", player?.username)
  if (player) {
    console.log("removeOldAddNewGame calles player, GID ", player.username, gId)
    const gameIndex = games.findIndex(g => g.gameId === player.gameId);
    let talkerindex = talkerTemp.findIndex(g => g.gameId === player.gameId);
    const playerIndex = findPlayer(player.username);
    if (player.gameId != undefined) {
      //remove the player from game and see if there are other players on the game
      games.splice(gameIndex, 1);
      talkerTemp.splice(talkerindex, 1);
    }
    delete players[playerIndex];
  }
}

function createNewGame(newGame?: NewGame) {
  console.log("createNewGame called")
  if (newGame) {
    console.log("if newGame entered")
    games.push({
      gameId: gId,
      playerCount: newGame.playerCount,
      mode: newGame.mode,
      // finished: 0,
      counter: [0, 0],
      aiDirection: 0,
      paddles: { paddle1: 0, paddle2: 0 },
      balld: { radius: 10, dx: cosDeg(45) * (Math.random() > 0.5 ? 1 : -1), dz: sinDeg(45) * (Math.random() > 0.5 ? 1 : -1), currentSpeed: 3, beginSpeed: 3, speedAfterHit: 6 },
      ballPos: { x: 0, y: 10 + 1, z: 0 },
      playerIds: newGame.playerIds,
      playername: newGame.playername
    })
  }
  else {
    console.log("else entered")
    games.push({
      gameId: gId,
      playerCount: 0,
      mode: 0,
      // finished: 0,
      counter: [0, 0],
      aiDirection: 0,
      paddles: { paddle1: 0, paddle2: 0 },
      balld: { radius: 10, dx: cosDeg(45) * (Math.random() > 0.5 ? 1 : -1), dz: sinDeg(45) * (Math.random() > 0.5 ? 1 : -1), currentSpeed: 3, beginSpeed: 3, speedAfterHit: 6 },
      ballPos: { x: 0, y: 10 + 1, z: 0 },
      playerIds: [0],
      playername: ["BOT", "BOT"]
    });
  }
  let gameindex = games.findIndex(g => g.gameId === gId)
  talkerTemp.push({ type: "talker", gameId: gId, paddles: games[gameindex].paddles, ballpos: games[gameindex].ballPos, counter: games[gameindex].counter, playername: games[gameindex].playername, playerCount: games[gameindex].playerCount })
  let gameId = gId;
  gId++;
  console.log("newGame Pushed")
  return gameId;
}

export function removeOldAddNewGame(player: Player, gId: number) {
  console.log("removeOldAddNewGame calles player, GID ", player.username, gId)
  const gameIndex = games.findIndex(g => g.gameId === player.gameId);
  let talkerindex = talkerTemp.findIndex(g => g.gameId === player.gameId);
  const playerIndex = findPlayer(player.username);
  if (player.gameId != undefined) {
    //remove the player from game and see if there are other players on the game
    games.splice(gameIndex, 1);
    talkerTemp.splice(talkerindex, 1);
  }
  players[playerIndex].gameId = gId;
}
let i = 0;
export function movePaddlesAndBalls(wsMessage: WSMessage) {
  i++;
  console.log(i);
  let player: Player = wsMessage.player;
  let newGame: NewGame | undefined = wsMessage.newGame;
  const playerIndex = findPlayer(player.username)
  if (playerIndex != -1)
    console.log("player exists");
  console.log("movePaddles called");

  //create a new game if newgame is passed
  if (newGame && newGame.type == "newGame") {
    console.log("game created new game given", gId);
    const gameId = createNewGame(newGame)
    removeOldAddNewGame(player, gameId);
    player.ws?.send(JSON.stringify(talkerTemp[talkerTemp.findIndex(g => g.gameId === gameId)]))
    return;
    // return talkerTemp[talkerTemp.findIndex(g => g.gameId === gameId)];
  }
  else if (playerIndex == -1) {
    console.log("game created new user user", playerIndex);
    const gameId = createNewGame()

    // if (Object.keys(players).length == 0)
    //////players[gId] the gid should be replaced by the id of the player in serverside
    player.gameId = gameId;
    players[gameId] = player
    return;
    // return talkerTemp[talkerTemp.findIndex(g => g.gameId === gameId)];
  }
  else {
    console.log("came in else")
    players[playerIndex].keys = player.keys;
    return;
  }


  // let talkerTempIndexForGame = talkerTemp.findIndex(g => g.gameId === player.gameId)
  // let gameIndexForGame = games.findIndex(g => g.gameId === player.gameId);

  // if (games[gameIndexForGame].finished == 1 && talkerTemp[talkerTempIndexForGame].finished == 0) {
  //   talkerTemp[talkerTempIndexForGame].finished = 1;
  //   return talkerTemp[talkerTempIndexForGame]
  // }
  // if (talkerTemp[talkerTempIndexForGame].finished == 0) {
  //   return talkerTemp[talkerTempIndexForGame];
  // }

}

setInterval(() => {
  // console.log("setinterval 60 called")
  let i = 0;
  while (games.length > i) {
    let talkerindex = talkerTemp.findIndex(g => g.gameId === games[i].gameId)
    let playerIndex = findPlayer(games[i].playername[0])
    if (playerIndex != -1 && players[playerIndex].pause == 1) {
      console.log("game paused");
      i++;
      continue
    }
    // if (games[i].finished == 1)
    //   continue;
    if (games[i].counter[0] == finalGoal || games[i].counter[1] == finalGoal)
    games[i].paddles = movePaddles(games[i]);
    games[i].ballPos = moveBall(games[i]);
    talkerTemp[talkerindex].paddles = games[i].paddles
    talkerTemp[talkerindex].ballpos = games[i].ballPos;
    talkerTemp[talkerindex].counter = games[i].counter;

    let j = findPlayer(games[i].playername[0])
    if (j != -1) {
      players[j].ws?.send(JSON.stringify(talkerTemp[talkerindex]));
    }
    if (games[i].mode == 0) {
      let playerIndex = findPlayer(undefined, games[i].gameId);
      if (playerIndex == -1) {
        console.log("player not found mode = 0, index -1")
      }
      else {
        players[playerIndex].ws?.send(JSON.stringify(talkerTemp[talkerindex]));
      }
    }

    // if (games[i].counter[0] == finalGoal || games[i].counter[1] == finalGoal)
    //   games[i].finished = 1;
    console.log(i, talkerindex)
    i++;
  }
  i = 0;
}, 1000 / 60);

// 1 second loop
setInterval(() => {
  games.forEach(game => {
    // if (game.finished != 1)
    game.aiDirection = AIDirection(game);
  });
}, 1000);