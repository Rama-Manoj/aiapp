package com.example.aiapp.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "ai_requests")
public class AiRequest {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "input_text", nullable = false, columnDefinition = "TEXT")
	private String inputText;

	@Column(nullable = false)
	private String action;

	@Column(nullable = false, columnDefinition = "TEXT")
	private String output;

	@Column(nullable = false)
	private Long userId;

	@CreationTimestamp
	@Column(updatable = false)
	private LocalDateTime createdAt;

	public AiRequest() {
	}

	public AiRequest(Long id, String inputText, String action, String output, Long userId, LocalDateTime createdAt) {
		this.id = id;
		this.inputText = inputText;
		this.action = action;
		this.output = output;
		this.userId = userId;
		this.createdAt = createdAt;
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getInputText() {
		return inputText;
	}

	public void setInputText(String inputText) {
		this.inputText = inputText;
	}

	public String getAction() {
		return action;
	}

	public void setAction(String action) {
		this.action = action;
	}

	public String getOutput() {
		return output;
	}

	public void setOutput(String output) {
		this.output = output;
	}

	public Long getUserId() {
		return userId;
	}

	public void setUserId(Long userId) {
		this.userId = userId;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(LocalDateTime createdAt) {
		this.createdAt = createdAt;
	}
}
