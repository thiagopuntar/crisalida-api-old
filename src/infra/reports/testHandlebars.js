const express = require("express");
const handlebars = require("express-handlebars");
const fs = require("fs-extra");
const path = require("path");
const port = 3005;

const app = express();

const moduleReport = path.resolve(
  "C:\\_PROJETOS\\crisalida\\api\\src\\infra\\reports\\emails"
); //Pasta do módulo do relatório!
const report = "orderConfirmed.hbs"; //Nome do arquivo de relatório
const dataPath = path.resolve(__dirname, "./teste.json"); //Caminho pro arquivo de data.json

app.set("view engine", "hbs");
app.set("views", moduleReport);
app.engine(
  "hbs",
  handlebars({
    layoutsDir: moduleReport,
    partialsDir: moduleReport,
    extname: "hbs",
  })
);

//Criei meu próprio static, baseado no diretório que está os arquivos statics do projeto
app.use(express.static(path.resolve(process.cwd(), "../public")));

app.get("/", async (req, res) => {
  // Load do data a ser inputado no handlebars
  const dataJSON = await fs.readFile(dataPath);
  const data = JSON.parse(dataJSON);

  res.render(report, { layout: false, ...data });
});

app.listen(port, () => console.log(`Test server on port ${port}`));
