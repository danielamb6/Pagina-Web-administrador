// ============================================
// GESTIÓN DE USUARIOS
// ============================================

class UsuarioService {
    constructor() {
        this.usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
        this.cargarUsuariosDemoSiVacio();
    }
    
    // Cargar usuarios demo si no hay ninguno
    cargarUsuariosDemoSiVacio() {
        if (this.usuarios.length === 0) {
            this.usuarios = [
                {
                    id: 1,
                    nombre: "Administrador Principal",
                    username: "admin",
                    email: "admin@incidencias.com",
                    password: "Admin123",
                    rol: "administrador",
                    empresa: "Sistema",
                    activo: true,
                    fechaRegistro: new Date().toISOString().split('T')[0]
                },
                {
                    id: 2,
                    nombre: "Técnico Demo",
                    username: "tecnico",
                    email: "tecnico@empresa.com",
                    password: "Tecnico123",
                    rol: "tecnico",
                    empresa: "Zoxo",
                    activo: true,
                    fechaRegistro: "2024-01-15"
                }
            ];
            this.guardarEnStorage();
        }
    }
    
    // Obtener todos los usuarios
    obtenerUsuarios() {
        return [...this.usuarios];
    }
    
    // Buscar usuario por ID
    obtenerUsuarioPorId(id) {
        return this.usuarios.find(u => u.id === id);
    }
    
    // Buscar usuario por email o username
    buscarUsuarioPorCredencial(identificador) {
        return this.usuarios.find(u => 
            u.email === identificador || u.username === identificador
        );
    }
    
    // Crear o actualizar usuario
    guardarUsuario(usuarioData) {
        if (usuarioData.id) {
            // Actualizar usuario existente
            const index = this.usuarios.findIndex(u => u.id === usuarioData.id);
            if (index !== -1) {
                // Mantener la contraseña si no se proporciona una nueva
                if (!usuarioData.password && this.usuarios[index].password) {
                    usuarioData.password = this.usuarios[index].password;
                }
                this.usuarios[index] = usuarioData;
            }
        } else {
            // Crear nuevo usuario
            usuarioData.id = this.generarNuevoId();
            usuarioData.fechaRegistro = new Date().toISOString().split('T')[0];
            usuarioData.activo = true;
            this.usuarios.push(usuarioData);
        }
        
        this.guardarEnStorage();
        
        // Sincronizar con auth service
        if (window.auth) {
            auth.usuarios = this.usuarios;
        }
        
        return usuarioData;
    }
    
    // Cambiar estado activo/inactivo
    cambiarEstadoUsuario(id, activo) {
        const usuario = this.obtenerUsuarioPorId(id);
        if (usuario) {
            usuario.activo = activo;
            this.guardarEnStorage();
            return true;
        }
        return false;
    }
    
    // Eliminar usuario (lógico, cambiando estado)
    eliminarUsuario(id) {
        return this.cambiarEstadoUsuario(id, false);
    }
    
    // Buscar usuarios por término
    buscarUsuarios(termino) {
        if (!termino) return this.obtenerUsuarios();
        
        const terminoLower = termino.toLowerCase();
        return this.usuarios.filter(usuario => 
            usuario.nombre.toLowerCase().includes(terminoLower) ||
            usuario.username.toLowerCase().includes(terminoLower) ||
            usuario.email.toLowerCase().includes(terminoLower) ||
            (usuario.empresa && usuario.empresa.toLowerCase().includes(terminoLower))
        );
    }
    
    // Validar si username o email ya existen
    validarCredencialesUnicas(username, email, idExcluir = null) {
        return this.usuarios.find(u => 
            u.id !== idExcluir && 
            (u.username === username || u.email === email)
        );
    }
    
    // Generar nuevo ID
    generarNuevoId() {
        return this.usuarios.length > 0 
            ? Math.max(...this.usuarios.map(u => u.id)) + 1 
            : 1;
    }
    
    // Guardar en localStorage
    guardarEnStorage() {
        localStorage.setItem('usuarios', JSON.stringify(this.usuarios));
    }
    
    // Reiniciar datos demo
    reiniciarDatosDemo() {
        this.usuarios = [
            {
                id: 1,
                nombre: "Administrador Principal",
                username: "admin",
                email: "admin@incidencias.com",
                password: "Admin123",
                rol: "administrador",
                empresa: "Sistema",
                activo: true,
                fechaRegistro: new Date().toISOString().split('T')[0]
            },
            {
                id: 2,
                nombre: "Técnico Demo",
                username: "tecnico",
                email: "tecnico@empresa.com",
                password: "Tecnico123",
                rol: "tecnico",
                empresa: "Zoxo",
                activo: true,
                fechaRegistro: "2024-01-15"
            }
        ];
        this.guardarEnStorage();
        return this.usuarios;
    }
}

// Instancia global de servicio de usuarios
const usuarioService = new UsuarioService();