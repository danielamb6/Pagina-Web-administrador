// ============================================
// FUNCIONES COMUNES UTILITARIAS
// ============================================

class Utilidades {
    constructor() {}
    
    // Mostrar mensaje de éxito
    mostrarExito(mensaje, duracion = 3000) {
        this.mostrarMensaje(mensaje, 'success', duracion);
    }
    
    // Mostrar mensaje de error
    mostrarError(mensaje, duracion = 5000) {
        this.mostrarMensaje(mensaje, 'error', duracion);
    }
    
    // Mostrar mensaje genérico
    mostrarMensaje(texto, tipo = 'info', duracion = 3000) {
        // Crear elemento de mensaje
        const mensajeDiv = document.createElement('div');
        mensajeDiv.className = `alert alert-${tipo}`;
        mensajeDiv.innerHTML = `
            <i class="fas fa-${tipo === 'success' ? 'check-circle' : 
                               tipo === 'error' ? 'exclamation-circle' : 
                               tipo === 'warning' ? 'exclamation-triangle' : 
                               'info-circle'}"></i> 
            ${texto}
        `;
        
        // Estilos dinámicos
        mensajeDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            background: ${tipo === 'success' ? '#d4edda' : 
                         tipo === 'error' ? '#f8d7da' : 
                         tipo === 'warning' ? '#fff3cd' : '#d1ecf1'};
            color: ${tipo === 'success' ? '#155724' : 
                    tipo === 'error' ? '#721c24' : 
                    tipo === 'warning' ? '#856404' : '#0c5460'};
            border-left: 4px solid ${tipo === 'success' ? '#28a745' : 
                                   tipo === 'error' ? '#dc3545' : 
                                   tipo === 'warning' ? '#ffc107' : '#17a2b8'};
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease-out;
            max-width: 400px;
        `;
        
        // Agregar al documento
        document.body.appendChild(mensajeDiv);
        
        // Eliminar después del tiempo especificado
        setTimeout(() => {
            mensajeDiv.style.animation = 'slideOut 0.3s ease-out forwards';
            setTimeout(() => {
                if (mensajeDiv.parentNode) {
                    mensajeDiv.parentNode.removeChild(mensajeDiv);
                }
            }, 300);
        }, duracion);
        
        // Agregar animación CSS si no existe
        if (!document.querySelector('#animation-styles')) {
            const style = document.createElement('style');
            style.id = 'animation-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Validar email
    validarEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }
    
    // Validar contraseña (mínimo 8 caracteres, 1 mayúscula, 1 número)
    validarPassword(password) {
        return password.length >= 8 &&  /[A-Z]/.test(password) &&  /\d/.test(password);
    }
    
    // Obtener iniciales del nombre
    obtenerIniciales(nombre) {
        if (!nombre) return 'U';
        return nombre.split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }
}

// Instancia global de utilidades
const util = new Utilidades();