/**
 * Classe responsável pela autenticação e autorização de usuários.
 * Orientada a Objetos conforme solicitado.
 */
class UserAuth {
    constructor() {
        this.email = Session.getActiveUser().getEmail();
        this.domain = this.email.split('@')[1];
        this.allowedDomain = 'luizalabs.com'; // Domínio configurado conforme appsscript.json
    }

    /**
     * Verifica se o usuário pertence ao domínio permitido.
     * @returns {boolean}
     */
    isValidDomain() {
        return this.domain === this.allowedDomain;
    }

    /**
     * Verifica se o usuário é administrador.
     * Consulta a aba 'Admins' da planilha.
     * @returns {boolean}
     */
    isAdmin() {
        try {
            const spreadsheetId = PropertiesService.getScriptProperties().getProperty('PLANILHA_ID');
            const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
            const admins = spreadsheet.getSheetByName('Admins').getDataRange().getValues().flat();
            return admins.includes(this.email);
        } catch (e) {
            console.error('Erro ao verificar admin:', e);
            return false;
        }
    }

    /**
     * Retorna os dados do usuário para o frontend.
     * @returns {Object}
     */
    getUserProfile() {
        const isAdmin = this.isAdmin();
        return {
            email: this.email,
            name: this.email.split('@')[0].replace(/\./g, ' '), // Nome amigável baseado no email
            isAdmin: isAdmin,
            isValid: this.isValidDomain()
        };
    }
}

/**
 * Endpoints globais expostos para o frontend
 */

function getCompleteUserProfile() {
    const auth = new UserAuth();
    return auth.getUserProfile();
}

function checkIsAdmin() {
    const auth = new UserAuth();
    return auth.isAdmin();
}
