package com.pawpal.service;

import com.pawpal.model.User;
import com.pawpal.repo.UserRepository;
import com.pawpal.util.JwtUtil;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    public Map<String, Object> signup(String name, String email, String password, String phone, String city) {
        // Check if user already exists
        if (userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("User with this email already exists");
        }

        // Create new user
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        if (phone != null && !phone.trim().isEmpty()) {
            user.setPhone(phone);
        }
        if (city != null && !city.trim().isEmpty()) {
            user.setCity(city);
        }

        User savedUser = userRepository.save(user);

        // Generate JWT token
        String token = jwtUtil.generateToken(savedUser.getId(), savedUser.getEmail());

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("user", createUserResponse(savedUser));
        return response;
    }

    public Map<String, Object> login(String email, String password) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        
        if (userOpt.isEmpty() || !passwordEncoder.matches(password, userOpt.get().getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        User user = userOpt.get();
        String token = jwtUtil.generateToken(user.getId(), user.getEmail());

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("user", createUserResponse(user));
        return response;
    }

    public Optional<User> getUserById(Long userId) {
        return userRepository.findById(userId);
    }

    private Map<String, Object> createUserResponse(User user) {
        Map<String, Object> userResponse = new HashMap<>();
        userResponse.put("id", user.getId());
        userResponse.put("name", user.getName());
        userResponse.put("email", user.getEmail());
        userResponse.put("phone", user.getPhone());
        userResponse.put("city", user.getCity());
        return userResponse;
    }
}


