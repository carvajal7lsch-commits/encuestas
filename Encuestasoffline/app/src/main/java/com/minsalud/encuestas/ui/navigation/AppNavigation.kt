package com.minsalud.encuestas.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.minsalud.encuestas.ui.form.FormScreen
import com.minsalud.encuestas.ui.login.LoginScreen
import com.minsalud.encuestas.ui.main.MainScreen

@Composable
fun AppNavigation() {
    val navController = rememberNavController()

    NavHost(navController = navController, startDestination = "login") {
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
