require("dotenv").config();
const express = require("express");
const WebSocket = require("ws");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

// Criar servidor HTTP e WebSocket
const server = app.listen(PORT, () => {
  console.log(`Servidor WebSocket http://localhost:${PORT}`);
});

const wss = new WebSocket.Server({ server });

// Mapear clientes conectados com nomes de utilizadores
const clients = new Map();
let userCount = 1; // Contador de utilizadores para gerar nomes USER1, USER2...

// Função para gerar um nome de utilizador disponível
const getAvailableUsername = () => {
  return `USER${userCount++}`;
};

// Função para atualizar a lista de utilizadores conectados
const updateUserList = () => {
  const userList = Array.from(clients.keys()); // Obtém todos os nomes de utilizadores
  clients.forEach((ws, username) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "USER_LIST", users: userList.filter(user => user !== username) }));
    }
  });
};

wss.on("connection", (ws) => {
  const username = getAvailableUsername();
  ws.username = username; // Associar o nome ao WebSocket
  clients.set(username, ws); // Guardar na lista de clientes ativos

  console.log(`Cliente conectado: ${username}`);

  // Enviar o nome de utilizador para o próprio cliente
  ws.send(JSON.stringify({ type: "ASSIGN_USERNAME", username }));

  // Atualizar a lista de utilizadores conectados para todos
  updateUserList();

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === "REQUEST_USER_LIST") {
        // Enviar a lista de utilizadores apenas para quem pediu
        const userList = Array.from(clients.keys());
        ws.send(JSON.stringify({ type: "USER_LIST", users: userList }));
      } else if (data.recipient && clients.has(data.recipient)) {
        const recipientSocket = clients.get(data.recipient);

        // Enviar a mensagem para o destinatário com o remetente correto
        recipientSocket.send(JSON.stringify({ sender: ws.username, message: data.message }));

        // Enviar para o próprio remetente a confirmação com o remetente correto
        ws.send(JSON.stringify({ sender: "Eu", message: data.message }));
      }
    } catch (error) {
      console.error("Erro ao processar mensagem:", error);
    }
  });

  ws.on("close", () => {
    console.log(`Cliente desconectado: ${ws.username}`);
    clients.delete(ws.username);
    updateUserList(); // Atualiza a lista de utilizadores após a saída
  });
});