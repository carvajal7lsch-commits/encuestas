package com.minsalud.encuestas.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalContext
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.minsalud.encuestas.ui.form.FormScreen
import com.minsalud.encuestas.ui.login.LoginScreen
import com.minsalud.encuestas.ui.main.MainScreen
import com.minsalud.encuestas.util.TokenManager

@Composable
fun AppNavigation() {
    val navController = rememberNavController()
    val context = LocalContext.current
    val tokenManager = remember(context) { TokenManager(context) }
    val hasToken = remember(tokenManager) { !tokenManager.getToken().isNullOrEmpty() }
    val startDestination = if (hasToken) "main" else "login"

    NavHost(navController = navController, startDestination = startDestination) {
        composable("login") {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate("main") {
                        popUpTo("login") { inclusive = true }
                    }
                }
            )
        }
        composable("main") {
            MainScreen(
                onPersonFound = { documento ->
                    navController.navigate("form/$documento")
                },
                onLogout = {
                    tokenManager.clearToken()
                    navController.navigate("login") {
                        popUpTo("main") { inclusive = true }
                    }
                }
            )
        }
        composable("form/{documento}") { backStackEntry ->
            val documento = backStackEntry.arguments?.getString("documento") ?: ""
            FormScreen(
                documento = documento,
                onFormSaved = {
                    navController.navigate("main") {
                        popUpTo("main") { inclusive = true }
                    }
                },
                onBack = {
                    navController.popBackStack()
                }
            )
        }
    }
}

