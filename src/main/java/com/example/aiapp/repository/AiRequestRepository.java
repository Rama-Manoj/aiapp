package com.example.aiapp.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import com.example.aiapp.entity.AiRequest;

public interface AiRequestRepository extends JpaRepository<AiRequest, Long> {

    Page<AiRequest> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<AiRequest> findAllByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

}