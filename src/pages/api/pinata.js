import formidable from "formidable";
import fs from "fs";
import FormData from "form-data";
import axios from "axios";

export const config = {
  api: {
    bodyParser: false, // Desativar o bodyParser para permitir uploads
  },
};

//https://pinata.cloud Criar uma conta Free aqui (500 Files + 1GB Storage)

export default async function handler(req, res) {
  if (req.method === "POST") {
    const form = formidable({
      uploadDir: "./temp/uploads",
      keepExtensions: true,
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Erro ao processar o ficheiro:", err);
        return res.status(500).json({ error: "Erro ao processar o ficheiro." });
      }

      const file = Array.isArray(files.file) ? files.file[0] : files.file;

      if (!file || !fs.existsSync(file.filepath)) {
        console.error("Ficheiro inválido ou inexistente.");
        return res.status(400).json({ error: "Ficheiro inválido ou inexistente." });
      }

      try {
        console.log("Preparando o ficheiro para upload no Pinata...");
        const formData = new FormData();
        formData.append("file", fs.createReadStream(file.filepath), file.originalFilename);

        const url = "https://api.pinata.cloud/pinning/pinFileToIPFS";
        const response = await axios.post(url, formData, {
          headers: {
            ...formData.getHeaders(),
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_API_SECRET,
          },
        });

        console.log("Ficheiro carregado com sucesso no IPFS:", response.data);

        fs.unlink(file.filepath, (err) => {
          if (err) console.error("Erro ao apagar o ficheiro temporário:", err);
        });

        return res.status(200).json(response.data);
      } catch (error) {
        console.error("Erro ao carregar o ficheiro para o Pinata:", error.message);
        fs.unlink(file.filepath, (err) => {
          if (err) console.error("Erro ao apagar o ficheiro temporário após falha:", err);
        });
        return res.status(500).json({ error: "Erro ao carregar o ficheiro para o Pinata." });
      }
    });
  } else if (req.method === "GET") {
    try {
      console.log("A obter a lista de ficheiros do Pinata...");

      const url = "https://api.pinata.cloud/data/pinList";
      const response = await axios.get(url, {
        headers: {
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_API_SECRET,
        },
      });

      const pinnedFiles = response.data.rows.filter((file) => !file.date_unpinned);
      console.log("Ficheiros obtidos com sucesso:", pinnedFiles);

      return res.status(200).json(pinnedFiles);
    } catch (error) {
      console.error("Erro ao obter os ficheiros do Pinata:", error.message);
      return res.status(500).json({ error: "Erro ao listar ficheiros no IPFS." });
    }
  } else if (req.method === "DELETE") {
    const { hash } = req.query;

    if (!hash) {
      return res.status(400).json({ error: "Nenhum hash foi fornecido." });
    }

    try {
      console.log(`Apagando ficheiro do IPFS com hash: ${hash}`);
      const url = `https://api.pinata.cloud/pinning/unpin/${hash}`;
      await axios.delete(url, {
        headers: {
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_API_SECRET,
        },
      });

      console.log("Ficheiro apagado com sucesso no Pinata.");
      return res.status(200).json({ message: "Ficheiro apagado com sucesso." });
    } catch (error) {
      console.error("Erro ao apagar o ficheiro do Pinata:", error.message);
      return res.status(500).json({ error: "Erro ao apagar o ficheiro do IPFS." });
    }
  } else {
    res.setHeader("Allow", ["POST", "GET", "DELETE"]);
    return res.status(405).json({ error: `Método ${req.method} não permitido.` });
  }
}
