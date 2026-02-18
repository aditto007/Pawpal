package com.pawpal.config;

import com.pawpal.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Skip filter for public endpoints
        String path = request.getRequestURI();
        if (path.startsWith("/api/auth") || path.startsWith("/api/clinics") || path.startsWith("/api/health")) {
            filterChain.doFilter(request, response);
            return;
        }

        // For SOS endpoints, GET is public, but POST/PUT require auth
        if (path.startsWith("/api/sos")) {
            String method = request.getMethod();
            boolean isOptions = "OPTIONS".equals(method);
            boolean isPublicGet = "GET".equals(method) && !path.startsWith("/api/sos/mine");

            if (isOptions || isPublicGet) {
                // Allow public SOS listing/detail queries, but keep /mine protected
                filterChain.doFilter(request, response);
                return;
            }
        }

        // Extract token from header
        String authHeader = request.getHeader("Authorization");
        String token = jwtUtil.extractTokenFromHeader(authHeader);

        if (token == null || jwtUtil.isTokenExpired(token)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Unauthorized: Invalid or missing token\"}");
            return;
        }

        try {
            // Extract user ID and email from token
            Long userId = jwtUtil.getUserIdFromToken(token);
            String email = jwtUtil.getEmailFromToken(token);

            if (userId != null && email != null) {
                // Set user ID as request attribute for controllers to use
                request.setAttribute("userId", userId);
                request.setAttribute("userEmail", email);
            }

            filterChain.doFilter(request, response);
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Unauthorized: Invalid token\"}");
        }
    }
}


