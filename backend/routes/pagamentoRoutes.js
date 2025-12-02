const express = require('express');
const router = express.Router();
const pagamentoController = require('../controllers/pagamentoController');

// CRUD de pagamentos

router.get('/abrirCrudPagamento', pagamentoController.abrirCrudPagamento);
router.get('/pedidosPagos', pagamentoController.pedidosPagos);
router.get('/carrinho/:idCarrinho', pagamentoController.obterPagamentoPorCarrinho);
router.get('/', pagamentoController.listarPagamentos);
router.post('/', pagamentoController.criarPagamento);
router.get('/:id', pagamentoController.obterPagamento);
router.put('/:id', pagamentoController.atualizarPagamento);
router.delete('/:id', pagamentoController.deletarPagamento);

module.exports = router;
