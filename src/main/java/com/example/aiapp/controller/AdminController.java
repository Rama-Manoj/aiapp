package com.example.aiapp.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.aiapp.entity.AiRequest;
import com.example.aiapp.entity.User;
import com.example.aiapp.repository.AiRequestRepository;
import com.example.aiapp.repository.UserRepository;

import jakarta.transaction.Transactional;

@RestController
@RequestMapping("/admin")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AiRequestRepository aiRequestRepository;

    // ================= ADMIN VALIDATION =================

    private void validateAdmin(Long adminId) {
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        if (!"ADMIN".equalsIgnoreCase(admin.getRole())) {
            throw new RuntimeException("Access denied");
        }
    }

    // ================= USERS (PAGINATED) =================
    @GetMapping("/users")
    public Page<User> getAllUsers(
            @RequestParam Long adminId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {

        validateAdmin(adminId);

        Pageable pageable = PageRequest.of(page, size, Sort.by("id").ascending());

        return userRepository.findAll(pageable);
    }
    
    
    @DeleteMapping("/users/{id}")
    @Transactional
    public ResponseEntity<Void> deleteUser(
            @PathVariable Long id,
            @RequestParam Long adminId
    ) {
        validateAdmin(adminId);

        if (id.equals(adminId)) {
            return ResponseEntity.badRequest().build();
        }

        userRepository.deleteById(id);

        return ResponseEntity.noContent().build(); // 204
    }

    
    

    @PutMapping("/users/{id}/role")
    public ResponseEntity<String> changeUserRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload,
            @RequestParam Long adminId
    ) {
        validateAdmin(adminId);

        String role = payload.get("role").toUpperCase();

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setRole(role);
        userRepository.save(user);

        return ResponseEntity.ok("Role updated");
    }

    // ================= REQUESTS (PAGINATED) =================

    @GetMapping("/requests")
    public Map<String, Object> getRequests(
            @RequestParam Long adminId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size
    ) {
        validateAdmin(adminId);

        Page<AiRequest> requestPage =
                aiRequestRepository.findAllByOrderByCreatedAtDesc(
                        PageRequest.of(page, size)
                );

        List<Map<String, Object>> requests =
                requestPage.getContent().stream().map(r -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", r.getId());
                    map.put("action", r.getAction());
                    map.put("createdAt", r.getCreatedAt());
                    map.put("inputText", r.getInputText());
                    map.put("output", r.getOutput());

                    User user = userRepository.findById(r.getUserId()).orElse(null);
                    map.put("userEmail", user != null ? user.getEmail() : "Unknown");

                    return map;
                }).toList();

        Map<String, Object> response = new HashMap<>();
        response.put("content", requests);
        response.put("totalElements", requestPage.getTotalElements());
        response.put("totalPages", requestPage.getTotalPages());

        return response;
    }

    @DeleteMapping("/requests/{id}")
    @Transactional
    public ResponseEntity<Void> deleteRequest(
            @PathVariable Long id,
            @RequestParam Long adminId
    ) {
        validateAdmin(adminId);
        aiRequestRepository.deleteById(id);
        return ResponseEntity.noContent().build(); // 204
    }
    
    
    // ================= ANALYTICS =================

    @GetMapping("/analytics")
    public Map<String, Object> getAnalytics(@RequestParam Long adminId) {

        validateAdmin(adminId);

        long totalUsers = userRepository.count();
        long totalRequests = aiRequestRepository.count();
        long totalAdmins = userRepository.countByRole("ADMIN");
        long totalNormalUsers = totalUsers - totalAdmins;

        Map<String, Object> data = new HashMap<>();
        data.put("totalUsers", totalUsers);
        data.put("totalRequests", totalRequests);
        data.put("totalAdmins", totalAdmins);
        data.put("totalNormalUsers", totalNormalUsers);

        return data;
    }
}