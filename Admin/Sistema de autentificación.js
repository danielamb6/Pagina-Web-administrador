// ============================================
// SISTEMA DE AUTENTICACIÓN
// ============================================

class AuthService {
    constructor() {
        this.usuarios = JSON.parse(localStorage.getItem('usuarios')) || this.getUsuariosIniciales();
        this.usuarioActual = null;
        this.verificarSesion();
    }
    
    // Usuarios iniciales por defecto
    getUsuariosIniciales() {
        return [
            {
                id: 1,
                nombre: "Administrador Principal",
                username: "admin",
                email: "admin@incidencias.com",
                password: "Admin123", // Recuerda: En producción esto debe estar hasheado
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
    }
    
    // Autenticar usuario
    autenticar(identificador, password) {
        // Buscar usuario por email o username
        const usuario = this.usuarios.find(u => 
            (u.email === identificador || u.username === identificador)
        );
        
        if (!usuario) {
            return { 
                success: false, 
                message: "Usuario no encontrado" 
            };
        }
        
        // Verificar si tiene contraseña
        if (!usuario.password) {
            return { 
                success: false, 
                message: "Este usuario no tiene contraseña configurada" 
            };
        }
        
        // Verificar contraseña
        if (usuario.password !== password) {
            return { 
                success: false, 
                message: "Contraseña incorrecta" 
            };
        }
        
        // Verificar si está activo
        if (usuario.activo === false) {
            return { 
                success: false, 
                message: "Usuario desactivado. Contacta al administrador." 
            };
        }
        
        this.usuarioActual = usuario;
        return { 
            success: true, 
            usuario: usuario 
        };
    }
    
    // Guardar sesión
    guardarSesion(usuario, recordar = false) {
        const sesionData = {
            id: usuario.id,
            nombre: usuario.nombre,
            username: usuario.username,
            email: usuario.email,
            rol: usuario.rol,
            empresa: usuario.empresa,
            timestamp: new Date().getTime()
        };
        
        if (recordar) {
            // Guardar por 30 días en localStorage
            localStorage.setItem('sesion', JSON.stringify(sesionData));
        } else {
            // Guardar solo para esta sesión
            sessionStorage.setItem('sesion', JSON.stringify(sesionData));
        }
        
        // Guardar usuario completo para uso en la app
        localStorage.setItem('usuarioActual', JSON.stringify(usuario));
    }
    
    // Verificar si hay sesión activa
    verificarSesion() {
        const sesion = localStorage.getItem('sesion') || sessionStorage.getItem('sesion');
        
        if (sesion) {
            const sesionData = JSON.parse(sesion);
            const ahora = new Date().getTime();
            
            // Verificar expiración (30 días para localStorage)
            if (localStorage.getItem('sesion')) {
                const tiempoSesion = 30 * 24 * 60 * 60 * 1000; // 30 días
                if (ahora - sesionData.timestamp < tiempoSesion) {
                    // Buscar usuario actualizado
                    const usuario = this.usuarios.find(u => u.id === sesionData.id);
                    if (usuario && usuario.activo !== false) {
                        this.usuarioActual = usuario;
                        return true;
                    }
                } else {
                    // Sesión expirada
                    this.cerrarSesion();
                }
            } else if (sessionStorage.getItem('sesion')) {
                // Sesión de navegador
                const usuario = this.usuarios.find(u => u.id === sesionData.id);
                if (usuario && usuario.activo !== false) {
                    this.usuarioActual = usuario;
                    return true;
                }
            }
        }
        
        return false;
    }
    
    // Obtener usuario actual
    obtenerUsuarioActual() {
        if (!this.usuarioActual) {
            const usuarioData = localStorage.getItem('usuarioActual');
            if (usuarioData) {
                this.usuarioActual = JSON.parse(usuarioData);
            }
        }
        return this.usuarioActual;
    }
    
    // Cerrar sesión
    cerrarSesion() {
        this.usuarioActual = null;
        localStorage.removeItem('sesion');
        sessionStorage.removeItem('sesion');
        localStorage.removeItem('usuarioActual');
    }
    
    // Verificar permisos según rol
    tienePermiso(rolRequerido) {
        const usuario = this.obtenerUsuarioActual();
        if (!usuario) return false;
        
        const jerarquiaRoles = {
            'administrador': 3,
            'tecnico': 2,
            'usuario': 1
        };
        
        const nivelUsuario = jerarquiaRoles[usuario.rol] || 0;
        const nivelRequerido = jerarquiaRoles[rolRequerido] || 0;
        
        return nivelUsuario >= nivelRequerido;
    }
    
    // Redirigir según rol
    redirigirSegunRol() {
        const usuario = this.obtenerUsuarioActual();
        if (!usuario) return 'index.html';
        
        const rutas = {
            'administrador': 'admin.html',
            'tecnico': 'admin.html',
            'usuario': 'admin.html'
        };
        
        return rutas[usuario.rol] || 'index.html';
    }
}

// Instancia global de autenticación
const auth = new AuthService();
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
                }
            ];
            this.guardarEnStorage();
        }
    }
    
    // Obtener todos los usuarios
    obtenerUsuarios() {
        return [...this.usuarios]; // Copia para no modificar el original
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
        
        // Sincronizar con auth service si existe
        if (window.auth && auth.usuarios) {
            auth.usuarios = this.usuarios;
        }
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
// ============================================
// CONTROLADOR DE PÁGINA DE LOGIN
// ============================================

class LoginController {
    constructor() {
        this.init();
    }
    
    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.cargarElementos();
            this.configurarEventos();
            this.verificarSesionPrevia();
            this.cargarRecordarme();
        });
    }
    
    cargarElementos() {
        this.form = document.getElementById('login-form');
        this.inputIdentificador = document.getElementById('identificador');
        this.inputPassword = document.getElementById('password');
        this.checkRecordar = document.getElementById('remember');
        this.btnLogin = document.querySelector('.btn-login');
        this.errorMsg = document.getElementById('error-msg');
        this.forgotPasswordLink = document.getElementById('forgotPassword');
    }
    
    configurarEventos() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.iniciarSesion(e));
        }
        
        if (this.forgotPasswordLink) {
            this.forgotPasswordLink.addEventListener('click', (e) => this.recuperarContrasena(e));
        }
        
        // Efectos visuales en inputs
        document.querySelectorAll('input').forEach(input => {
            input.addEventListener('focus', function() {
                this.parentElement.parentElement.style.transform = 'translateY(-2px)';
            });
            
            input.addEventListener('blur', function() {
                this.parentElement.parentElement.style.transform = 'translateY(0)';
            });
        });
    }
    
    verificarSesionPrevia() {
        if (auth.verificarSesion()) {
            util.mostrarMensaje('Sesión detectada. Redirigiendo...', 'info');
            
            setTimeout(() => {
                window.location.href = auth.redirigirSegunRol();
            }, 1500);
        }
    }
    
    cargarRecordarme() {
        const recordar = localStorage.getItem('recordarUsuario') === 'true';
        if (recordar && this.checkRecordar) {
            this.checkRecordar.checked = true;
            
            const ultimoUsuario = localStorage.getItem('ultimoUsuario');
            if (ultimoUsuario && this.inputIdentificador) {
                this.inputIdentificador.value = ultimoUsuario;
                this.inputPassword.focus();
            }
        }
    }
    
    async iniciarSesion(e) {
        e.preventDefault();
        
        const identificador = this.inputIdentificador.value.trim();
        const password = this.inputPassword.value;
        const recordar = this.checkRecordar.checked;
        
        // Validación básica
        if (!identificador || !password) {
            this.mostrarError('Por favor, completa todos los campos');
            return;
        }
        
        // Mostrar estado de carga
        this.estadoCargando(true);
        
        // Pequeña pausa para efecto visual
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Intentar autenticar
        const resultado = auth.autenticar(identificador, password);
        
        if (resultado.success) {
            // Guardar sesión
            auth.guardarSesion(resultado.usuario, recordar);
            
            // Guardar preferencias
            localStorage.setItem('recordarUsuario', recordar);
            if (recordar) {
                localStorage.setItem('ultimoUsuario', identificador);
            } else {
                localStorage.removeItem('ultimoUsuario');
            }
            
            // Mostrar éxito
            this.estadoCargando(false, '¡Acceso concedido!');
            util.mostrarExito(`Bienvenido, ${resultado.usuario.nombre}`);
            
            // Redirigir después de breve pausa
            setTimeout(() => {
                window.location.href = auth.redirigirSegunRol();
            }, 1200);
            
        } else {
            // Mostrar error
            this.estadoCargando(false);
            this.mostrarError(resultado.message);
            
            // Efecto de error en el formulario
            this.efectoError();
        }
    }
    
    recuperarContrasena(e) {
        e.preventDefault();
        
        const identificador = this.inputIdentificador.value.trim();
        
        if (!identificador) {
            this.mostrarError('Ingresa tu correo o usuario para recuperar la contraseña');
            this.inputIdentificador.focus();
            return;
        }
        
        const usuario = usuarioService.buscarUsuarioPorCredencial(identificador);
        
        if (usuario) {
            util.mostrarMensaje(
                `Se ha enviado un enlace de recuperación a ${usuario.email}. ` +
                `Revisa tu bandeja de entrada.`,
                'info'
            );
        } else {
            this.mostrarError('No se encontró una cuenta con ese correo o usuario');
        }
    }
    
    estadoCargando(cargando, mensaje = null) {
        if (!this.btnLogin) return;
        
        if (cargando) {
            this.btnLogin.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
            this.btnLogin.disabled = true;
        } else {
            if (mensaje) {
                this.btnLogin.innerHTML = `<i class="fas fa-check"></i> ${mensaje}`;
            } else {
                this.btnLogin.innerHTML = '<i class="fas fa-sign-in-alt"></i> Ingresar';
                this.btnLogin.disabled = false;
            }
        }
    }
    
    mostrarError(mensaje) {
        if (this.errorMsg) {
            this.errorMsg.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${mensaje}`;
            this.errorMsg.style.display = "block";
        } else {
            util.mostrarError(mensaje);
        }
    }
    
    efectoError() {
        const loginCard = document.querySelector('.login-card');
        if (loginCard) {
            loginCard.style.animation = 'none';
            loginCard.style.transform = 'translateX(-10px)';
            
            setTimeout(() => {
                loginCard.style.transition = 'transform 0.3s ease';
                loginCard.style.transform = 'translateX(10px)';
                
                setTimeout(() => {
                    loginCard.style.transform = 'translateX(-10px)';
                    
                    setTimeout(() => {
                        loginCard.style.transform = 'translateX(0)';
                        loginCard.style.animation = 'fadeIn 0.5s ease-out';
                    }, 50);
                }, 50);
            }, 10);
        }
    }
}

// Inicializar controlador cuando se cargue la página
let loginController;
document.addEventListener('DOMContentLoaded', () => {
    loginController = new LoginController();
});