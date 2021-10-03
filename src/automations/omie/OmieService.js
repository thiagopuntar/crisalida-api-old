const axios = require("axios");
const baseURL = "https://app.omie.com.br/api/v1/";
const { OMIE_APP_KEY, OMIE_APP_SECRET } = process.env;

class OmieService {
  constructor() {
    this.appKey = OMIE_APP_KEY;
    this.appSecret = OMIE_APP_SECRET;
    this.request = axios.create({
      baseURL,
    });
  }

  async _post(resource, params) {
    const data = {
      app_key: this.appKey,
      app_secret: this.appSecret,
      ...params,
    };

    const headers = {
      "Content-type": "application/json",
    };

    const response = await this.request.post(resource, data, { headers });

    return response.data;
  }

  async _paginate(cb) {
    let pagina = 1;
    let total_de_paginas;

    do {
      total_de_paginas = await cb(pagina);
      pagina++;
    } while (pagina <= total_de_paginas);
  }

  async insertCustomer(customer) {
    const params = {
      call: "UpsertCliente",
      param: [customer],
    };

    return this._post("geral/clientes/", params);
  }

  async insertProduct(product) {
    const params = {
      call: "UpsertProduto",
      param: [product],
    };

    return this._post("geral/produtos/", params);
  }

  async insertPedido(data) {
    const params = {
      call: "IncluirPedido",
      param: [data],
    };

    return this._post("produtos/pedido/", params);
  }

  async updatePedido(data) {
    const params = {
      call: "AlterarPedidoVenda",
      param: [data],
    };

    return this._post("produtos/pedido/", params);
  }


  async faturarPedido(id) {
    const params = {
      call: "FaturarPedidoVenda",
      param: [
        {
          cCodIntPed: id,
        },
      ],
    };

    return this._post("produtos/pedidovendafat/", params);
  }

  async updateContaReceber(data) {
    const params = {
      call: "AlterarContaReceber",
      param: [data],
    };

    return this._post("financas/contareceber/", params);
  }

  async getContasReceber(cb) {
    await this._paginate(async (pagina) => {
      const params = {
        call: "ListarContasReceber",
        param: [
          {
            pagina,
            registros_por_pagina: 50,
            apenas_importado_api: "N",
            filtrar_apenas_titulos_em_aberto: "S",
          },
        ],
      };

      const { total_de_paginas, conta_receber_cadastro } = await this._post(
        "financas/contareceber/",
        params
      );

      await cb(conta_receber_cadastro);
      return total_de_paginas;
    });
  }

  async findContasReceber(cb, customerId) {
    await this._paginate(async (pagina) => {
      const params = {
        call: "ListarContasReceber",
        param: [
          {
            pagina,
            registros_por_pagina: 50,
            apenas_importado_api: "N",
            filtrar_apenas_titulos_em_aberto: "S",
            filtrar_cliente: customerId
          },
        ],
      };

      const { total_de_paginas, conta_receber_cadastro } = await this._post(
        "financas/contareceber/",
        params
      );

      await cb(conta_receber_cadastro);
      return total_de_paginas;
    });
  }

  async listAllContas(cb) {
    await this._paginate(async (pagina) => {
      const params = {
        call: "ListarContasReceber",
        param: [
          {
            pagina,
            registros_por_pagina: 50,
            apenas_importado_api: "S",
            "filtrar_conta_corrente": 1966403980
          },
        ],
      };

      const { total_de_paginas, conta_receber_cadastro } = await this._post(
        "financas/contareceber/",
        params
      );

      await cb(conta_receber_cadastro);
      return total_de_paginas;
    });
  }

  async excluirRecebimento(id) {
    const params = {
      call: "ExcluirContaReceber",
      param: [{
        chave_lancamento: id
      }],
    };

    return this._post("financas/contareceber/", params);
  }

  async lancarRecebimento(data) {
    const params = {
      call: "LancarRecebimento",
      param: [data],
    };

    return this._post("financas/contareceber/", params);
  }

  async incluirLancamentoCC(data) {
    const params = {
      call: "IncluirLancCC",
      param: [data],
    };

    return this._post("financas/contacorrentelancamentos/", params);
  }

  async incluirContaReceber(data) {
    const params = {
      call: "IncluirContaReceber",
      param: [data],
    };

    return this._post("financas/contareceber/", params);
  }
}

module.exports = OmieService;
