package com.example.aiapp.dto;

public class AiRequestDto {
	
    private String text;

    private String action;
    
    private Long userId;   // ✅ required
    
    public Long getUserId() {
		return userId;
	}

	public void setUserId(Long userId) {
		this.userId = userId;
	}

	public AiRequestDto() {
		// TODO Auto-generated constructor stub
	}

	public AiRequestDto(String text, String action) {
		super();
		this.text = text;
		this.action = action;
	}

	public String getText() {
		return text;
	}

	public void setText(String text) {
		this.text = text;
	}

	public String getAction() {
		return action;
	}

	public void setAction(String action) {
		this.action = action;
	}
    
    
}
