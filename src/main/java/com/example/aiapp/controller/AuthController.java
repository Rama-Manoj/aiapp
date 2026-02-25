package com.example.aiapp.controller;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import com.example.aiapp.dto.SignupRequestDto;
import com.example.aiapp.dto.UpdateUserRequestDto;
import com.example.aiapp.dto.UserResponseDto;
import com.example.aiapp.entity.User;
import com.example.aiapp.repository.UserRepository;

import org.springframework.security.crypto.password.PasswordEncoder;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // =========================
    // SIGNUP (BCrypt)
    // =========================
    @PostMapping("/signup")
    public UserResponseDto signup(@RequestBody SignupRequestDto dto) {

        userRepository.findByEmail(dto.getEmail())
                .ifPresent(u -> {
                    throw new RuntimeException("Email already registered");
                });

        User user = new User();
        user.setName(dto.getName());
        user.setEmail(dto.getEmail());

        // 🔐 HASH PASSWORD
        String encodedPassword = passwordEncoder.encode(dto.getPassword());
        user.setPassword(encodedPassword);

        user.setRole("USER");

        userRepository.save(user);

        return new UserResponseDto(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole()
        );
    }

    // =========================
    // LOGIN (BCrypt MATCH)
    // =========================
    @PostMapping("/login")
    public UserResponseDto login(@RequestBody User request) {

        Optional<User> optionalUser = userRepository.findByEmail(request.getEmail());

        if (optionalUser.isEmpty()) {
            throw new RuntimeException("User not found");
        }

        User user = optionalUser.get();

        // 🔐 MATCH RAW PASSWORD WITH HASH
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        return new UserResponseDto(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole()
        );
    }

    // =========================
    // UPDATE USER (BCrypt)
    // =========================
    @PutMapping("/update")
    public UserResponseDto updateUser(@RequestBody UpdateUserRequestDto dto) {

        User user = userRepository.findById(dto.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setName(dto.getName());
        user.setEmail(dto.getEmail());

        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            String encodedPassword = passwordEncoder.encode(dto.getPassword());
            user.setPassword(encodedPassword);
        }

        userRepository.save(user);

        return new UserResponseDto(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole()
        );
    }

    // =========================
    // DELETE
    // =========================
    @DeleteMapping("/delete/{id}")
    @Transactional
    public ResponseEntity<String> deleteUser(@PathVariable Long id) {

        userRepository.deleteById(id);
        return ResponseEntity.ok("User deleted successfully");
    }
}