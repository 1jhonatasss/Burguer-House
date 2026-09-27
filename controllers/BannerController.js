// ============================================
// controllers/BannerController.js
// Controller para gerenciamento de banners
// ============================================

const fs = require('fs');
const path = require('path');
const BannerModel = require('../models/Banner');

class BannerController {
    constructor() {
        this.bannerModel = new BannerModel();
    }

    // ============================================
    // LISTAR BANNERS
    // ============================================
    async listar(req, res) {
        try {
            console.log('📋 LISTANDO BANNERS');
            
            const banners = await this.bannerModel.listar();
            
            console.log(`✅ ${banners.length} banner(s) encontrado(s)`);
            
            res.render('admin/banners', {
                title: 'Banners - Admin',
                banners: banners,
                sucesso: req.query.sucesso === 'true'
            });
        } catch (error) {
            console.error('❌ ERRO AO LISTAR BANNERS:', error);
            res.render('admin/banners', {
                title: 'Banners - Admin',
                banners: [],
                erro: 'Erro ao carregar banners'
            });
        }
    }

    // ============================================
    // VIEW DE CADASTRO
    // ============================================
    cadastrarView(req, res) {
        try {
            res.render('admin/banner-form', {
                title: 'Novo Banner - Admin',
                banner: null
            });
        } catch (error) {
            console.error('❌ ERRO AO CARREGAR FORMULÁRIO:', error);
            res.redirect('/admin/banners');
        }
    }

    // ============================================
    // CADASTRAR NOVO BANNER (COM BASE64)
    // ============================================
    async cadastrar(req, res) {
        try {
            const { titulo, precoOriginal, precoPromocional, imagemCortada } = req.body;
            
            console.log('💾 CADASTRANDO NOVO BANNER:', titulo);
            
            // ============================================
            // VALIDAÇÕES
            // ============================================
            if (!titulo || !precoOriginal || !precoPromocional) {
                console.error('❌ Campos obrigatórios faltando');
                return res.status(400).send('Campos obrigatórios: título, preço original e preço promocional');
            }
            
            if (!imagemCortada) {
                console.error('❌ Imagem não foi cortada');
                return res.status(400).send('Por favor, corte a imagem antes de salvar');
            }
            
            // Validar preços
            const precoOrig = parseFloat(precoOriginal);
            const precoPromo = parseFloat(precoPromocional);
            
            if (isNaN(precoOrig) || isNaN(precoPromo) || precoOrig <= 0 || precoPromo <= 0) {
                return res.status(400).send('Preços inválidos');
            }
            
            if (precoPromo >= precoOrig) {
                return res.status(400).send('Preço promocional deve ser menor que o preço original');
            }
            
            // ============================================
            // PROCESSAR IMAGEM BASE64
            // ============================================
            const imagemUrl = await this.salvarImagemBase64(imagemCortada);
            
            if (!imagemUrl) {
                throw new Error('Falha ao salvar a imagem');
            }
            
            // ============================================
            // SALVAR NO BANCO DE DADOS
            // ============================================
            const bannerData = {
                titulo: titulo.trim(),
                imagemUrl: imagemUrl,
                precoOriginal: precoOrig,
                precoPromocional: precoPromo,
                ativo: 1
            };
            
            const resultado = await this.bannerModel.gravar(bannerData);
            
            if (resultado) {
                console.log('✅ Banner cadastrado com sucesso! ID:', resultado);
                res.redirect('/admin/banners?sucesso=true');
            } else {
                throw new Error('Falha ao salvar banner no banco de dados');
            }
            
        } catch (error) {
            console.error('❌ ERRO AO CADASTRAR BANNER:', error);
            res.status(500).send('Erro ao cadastrar banner: ' + error.message);
        }
    }

    // ============================================
    // VIEW DE EDIÇÃO
    // ============================================
    async editarView(req, res) {
        try {
            const { id } = req.params;
            
            if (!id) {
                return res.redirect('/admin/banners');
            }
            
            const banner = await this.bannerModel.obter(parseInt(id));
            
            if (!banner) {
                console.error('❌ Banner não encontrado:', id);
                return res.redirect('/admin/banners');
            }
            
            res.render('admin/banner-form', {
                title: 'Editar Banner - Admin',
                banner: banner
            });
            
        } catch (error) {
            console.error('❌ ERRO AO CARREGAR BANNER PARA EDIÇÃO:', error);
            res.redirect('/admin/banners');
        }
    }

    // ============================================
    // ATUALIZAR BANNER
    // ============================================
    async atualizar(req, res) {
        try {
            const { bannerId, titulo, precoOriginal, precoPromocional, imagemCortada } = req.body;
            
            console.log('🔄 ATUALIZANDO BANNER ID:', bannerId);
            
            if (!bannerId || !titulo || !precoOriginal || !precoPromocional) {
                return res.status(400).send('Campos obrigatórios faltando');
            }
            
            const idNumerico = parseInt(bannerId);
            if (isNaN(idNumerico)) {
                return res.status(400).send('ID inválido');
            }
            
            // Buscar banner atual
            const bannerAtual = await this.bannerModel.obter(idNumerico);
            
            if (!bannerAtual) {
                return res.status(404).send('Banner não encontrado');
            }
            
            // Determinar URL da imagem
            let imagemUrl = bannerAtual.imagemUrl;
            
            // Se enviou nova imagem cortada, processar
            if (imagemCortada) {
                // Excluir imagem antiga
                await this.excluirArquivoFisico(bannerAtual.imagemUrl);
                
                // Salvar nova imagem
                imagemUrl = await this.salvarImagemBase64(imagemCortada);
                
                if (!imagemUrl) {
                    throw new Error('Falha ao salvar nova imagem');
                }
            }
            
            // Atualizar no banco
            const bannerData = {
                bannerId: idNumerico,
                titulo: titulo.trim(),
                imagemUrl: imagemUrl,
                precoOriginal: parseFloat(precoOriginal),
                precoPromocional: parseFloat(precoPromocional)
            };
            
            const resultado = await this.bannerModel.atualizar(bannerData);
            
            if (resultado) {
                console.log('✅ Banner atualizado com sucesso!');
                res.redirect('/admin/banners?sucesso=true');
            } else {
                throw new Error('Falha ao atualizar banner');
            }
            
        } catch (error) {
            console.error('❌ ERRO AO ATUALIZAR BANNER:', error);
            res.status(500).send('Erro ao atualizar banner: ' + error.message);
        }
    }

    // ============================================
    // EXCLUIR BANNER
    // ============================================
    async excluir(req, res) {
        try {
            const { id } = req.params;
            
            console.log('🗑️ EXCLUINDO BANNER ID:', id);
            
            if (!id) {
                return res.json({ ok: false, msg: 'ID do banner não fornecido' });
            }
            
            const idNumerico = parseInt(id);
            if (isNaN(idNumerico)) {
                return res.json({ ok: false, msg: 'ID inválido' });
            }
            
            // Buscar banner para pegar o caminho da imagem
            const banner = await this.bannerModel.obter(idNumerico);
            
            if (!banner) {
                return res.json({ ok: false, msg: 'Banner não encontrado' });
            }
            
            // Excluir do banco
            const resultado = await this.bannerModel.excluir(idNumerico);
            
            if (resultado) {
                // Tentar excluir o arquivo físico
                await this.excluirArquivoFisico(banner.imagemUrl);
                
                console.log('✅ Banner excluído com sucesso!');
                res.json({ ok: true, msg: 'Banner excluído com sucesso!' });
            } else {
                res.json({ ok: false, msg: 'Erro ao excluir banner do banco de dados' });
            }
            
        } catch (error) {
            console.error('❌ ERRO AO EXCLUIR BANNER:', error);
            res.json({ ok: false, msg: 'Erro interno: ' + error.message });
        }
    }

    // ============================================
    // ALTERNAR STATUS (ATIVO/INATIVO)
    // ============================================
    async alternarStatus(req, res) {
        try {
            const { id } = req.params;
            const { ativo } = req.body;
            
            console.log('🔄 ALTERNANDO STATUS DO BANNER ID:', id, 'para:', ativo);
            
            if (!id) {
                return res.json({ ok: false, msg: 'ID do banner não fornecido' });
            }
            
            const idNumerico = parseInt(id);
            if (isNaN(idNumerico)) {
                return res.json({ ok: false, msg: 'ID inválido' });
            }
            
            const resultado = await this.bannerModel.atualizarStatus(idNumerico, ativo ? 1 : 0);
            
            if (resultado) {
                console.log('✅ Status atualizado com sucesso!');
                res.json({ ok: true, msg: 'Status atualizado com sucesso!' });
            } else {
                res.json({ ok: false, msg: 'Erro ao atualizar status' });
            }
            
        } catch (error) {
            console.error('❌ ERRO AO ALTERNAR STATUS:', error);
            res.json({ ok: false, msg: 'Erro interno: ' + error.message });
        }
    }

    // ============================================
    // API - OBTER BANNERS ATIVOS (PARA O CARDÁPIO)
    // ============================================
    async obterAtivos(req, res) {
        try {
            const bannersAtivos = await this.bannerModel.listarAtivos();
            
            res.json({
                ok: true,
                banners: bannersAtivos,
                total: bannersAtivos.length
            });
            
        } catch (error) {
            console.error('❌ ERRO AO OBTER BANNERS ATIVOS:', error);
            res.json({
                ok: false,
                banners: [],
                total: 0,
                msg: error.message
            });
        }
    }

    // ============================================
    // MÉTODO AUXILIAR: SALVAR IMAGEM BASE64
    // ============================================
    async salvarImagemBase64(imagemBase64) {
        try {
            console.log('💾 Salvando imagem base64...');
            
            // 1. Remover prefixo "data:image/jpeg;base64," ou similar
            const base64Data = imagemBase64.replace(/^data:image\/\w+;base64,/, '');
            
            // 2. Converter base64 para buffer
            const buffer = Buffer.from(base64Data, 'base64');
            
            // 3. Gerar nome único
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(7);
            const fileName = `banner-${timestamp}-${randomString}.jpg`;
            
            // 4. Definir caminho de upload
            const uploadDir = path.join(__dirname, '../public/uploads/banners/');
            const uploadPath = path.join(uploadDir, fileName);
            
            // 5. Criar diretório se não existir
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
                console.log('📁 Diretório criado:', uploadDir);
            }
            
            // 6. Salvar arquivo
            fs.writeFileSync(uploadPath, buffer);
            console.log('✅ Imagem salva:', fileName);
            
            // 7. Retornar URL relativa
            return `/uploads/banners/${fileName}`;
            
        } catch (error) {
            console.error('❌ ERRO AO SALVAR IMAGEM:', error);
            return null;
        }
    }

    // ============================================
    // MÉTODO AUXILIAR: EXCLUIR ARQUIVO FÍSICO
    // ============================================
    async excluirArquivoFisico(imagemUrl) {
        try {
            if (!imagemUrl) return;
            
            const filePath = path.join(__dirname, '../public', imagemUrl);
            
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log('🗑️ Arquivo excluído:', filePath);
            }
        } catch (error) {
            console.warn('⚠️ Não foi possível excluir arquivo:', error.message);
        }
    }
}

module.exports = BannerController;